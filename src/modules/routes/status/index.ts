import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest
} from 'fastify'
import fp from 'fastify-plugin'

export default fp(
  async (
    server: FastifyInstance,
    opts: FastifyPluginOptions,
    next: Function
  ) => {
    server.route({
      url: '/status',
      logLevel: 'warn',
      method: ['GET', 'HEAD'],
      handler: async (_: FastifyRequest, reply: FastifyReply) => {
        return reply.send({ timestamp: new Date().getTime() })
      }
    })
    next()
  }
)
