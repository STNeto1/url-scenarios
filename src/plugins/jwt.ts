import fastifyJwt from '@fastify/jwt'
import {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
  onRequestHookHandler
} from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: onRequestHookHandler
  }
}

const jwtPlugin: FastifyPluginAsync = fp(async (server, options) => {
  server.register(fastifyJwt, {
    secret: server.config.JWT_SECRET
  })

  server.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
      } catch (error) {
        return reply.code(401).send({
          message: 'Unauthorized',
          status_code: 401
        })
      }
    }
  )
})

export default jwtPlugin
