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
import { createUrlSchema } from './schemas'

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

    next()
  }
)
