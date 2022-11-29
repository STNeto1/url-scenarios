import cuid from 'cuid'
import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest
} from 'fastify'
import fp from 'fastify-plugin'
import superjson from 'superjson'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { sendUrlAccessMessage } from '../../../plugins/sqs'
import { safePagination } from '../../../utils/pagination'
import { JwtPayload } from '../auth/schemas'
import {
  createUrlSchema,
  deleteUrlSchema,
  findUrlSchema,
  publicUrlSchema,
  singleUrlSchema,
  urlListSchema
} from './schemas'

export default fp(
  async (server: FastifyInstance, _: FastifyPluginOptions, next: Function) => {
    server.route({
      url: '/v1/url/create',
      logLevel: 'warn',
      method: ['POST'],
      onRequest: [server.authenticate],
      schema: {
        body: zodToJsonSchema(createUrlSchema, 'createUrlSchema')
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        const payload = request.user as JwtPayload
        const body = request.body as z.infer<typeof createUrlSchema>

        const user = await server.prisma.user.findUnique({
          where: {
            id: payload.sub
          }
        })

        if (!user) {
          return reply.status(401).send({
            message: 'Unauthorized'
          })
        }

        const url = await server.prisma.url.create({
          data: {
            url: body.url,
            hash: cuid.slug(),
            userId: user.id
          }
        })

        await server.redis.set(url.hash, superjson.stringify(url), {
          EX: 60 * 60 * 24 // 1 day
        })

        return reply.status(201).send()
      }
    })

    server.route({
      url: '/v1/url/list',
      logLevel: 'warn',
      method: ['GET'],
      onRequest: [server.authenticate],
      schema: {
        response: {
          200: zodToJsonSchema(urlListSchema, 'urlListSchema')
        }
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        const payload = request.user as JwtPayload

        const pagination = safePagination(request.raw.url ?? '')

        const user = await server.prisma.user.findUnique({
          where: {
            id: payload.sub
          }
        })

        if (!user) {
          return reply.status(401).send({
            message: 'Unauthorized'
          })
        }

        const urls = await server.prisma.url.findMany({
          where: {
            userId: user.id,
            deletedAt: null
          },
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit
        })

        const count = await server.prisma.url.count({
          where: {
            userId: user.id,
            deletedAt: null
          }
        })

        return reply.status(200).send({
          data: urls,
          pages: Math.ceil(count / pagination.limit)
        })
      }
    })

    server.route({
      url: '/v1/url/delete/:id',
      logLevel: 'warn',
      method: ['DELETE'],
      onRequest: [server.authenticate],
      schema: {
        params: zodToJsonSchema(deleteUrlSchema, 'singleUrl')
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        const payload = request.user as JwtPayload
        const { id } = request.params as z.infer<typeof deleteUrlSchema>

        const user = await server.prisma.user.findUnique({
          where: {
            id: payload.sub
          }
        })

        if (!user) {
          return reply.status(401).send({
            message: 'Unauthorized'
          })
        }

        const url = await server.prisma.url.findUnique({
          where: {
            id
          }
        })
        if (!url || Boolean(url.deletedAt) || url.userId !== user.id) {
          return reply.status(404).send({
            message: 'Not found'
          })
        }

        await server.prisma.url.update({
          where: {
            id
          },
          data: {
            deletedAt: new Date()
          }
        })

        await server.redis.del(url.hash)

        return reply.status(204).send()
      }
    })

    server.route({
      url: '/v1/url/:hash',
      logLevel: 'warn',
      method: ['GET'],
      schema: {
        params: zodToJsonSchema(findUrlSchema, 'singleUrl'),
        response: {
          200: zodToJsonSchema(publicUrlSchema, 'publicUrlSchema')
        }
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        const { hash } = request.params as z.infer<typeof findUrlSchema>

        const redisUrl = await server.redis.get(hash)
        if (redisUrl) {
          sendUrlAccessMessage(
            server.sqs,
            superjson.parse<z.infer<typeof singleUrlSchema>>(redisUrl)
          )
          return reply
            .status(200)
            .send(superjson.parse<z.infer<typeof singleUrlSchema>>(redisUrl))
        }

        const url = await server.prisma.url.findFirst({
          where: {
            hash,
            deletedAt: null
          }
        })
        if (!url) {
          return reply.status(404).send({
            message: 'Not found'
          })
        }

        await server.redis.set(hash, superjson.stringify(url), {
          EX: 60 * 60 * 24 // 1 day
        })

        return reply.status(200).send(url)
      }
    })

    next()
  }
)
