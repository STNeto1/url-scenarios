import cuid from 'cuid'
import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest
} from 'fastify'
import fp from 'fastify-plugin'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { JwtPayload } from '../auth/schemas'
import {
  createUrlSchema,
  deleteUrlSchema,
  paginationSchema,
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

        await server.prisma.url.create({
          data: {
            url: body.url,
            hash: cuid.slug(),
            userId: user.id
          }
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
        params: zodToJsonSchema(paginationSchema, 'paginationSchema'),
        response: {
          200: zodToJsonSchema(urlListSchema, 'urlListSchema')
        }
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        const payload = request.user as JwtPayload
        const params = request.params as z.infer<typeof paginationSchema>

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
          skip: (params.page - 1) * params.limit,
          take: params.limit
        })
        const count = await server.prisma.url.count({
          where: {
            userId: user.id,
            deletedAt: null
          }
        })

        return reply.status(200).send({
          data: urls,
          pages: Math.ceil(count / params.limit)
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

        return reply.status(204).send()
      }
    })

    next()
  }
)
