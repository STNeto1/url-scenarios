import { fastify, FastifyInstance } from 'fastify'
import fastifyBlipp from 'fastify-blipp'
import { IncomingMessage, Server, ServerResponse } from 'http'

import authRoutes from './modules/routes/auth'
import statusRoutes from './modules/routes/status'
import prismaPlugin from './plugins/prisma'

const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
  fastify({ logger: true })

server.register(prismaPlugin)
server.register(fastifyBlipp)

server.register(statusRoutes)
server.register(authRoutes)

const start = async () => {
  try {
    await server.listen({
      port: 3000
    })
    server.blipp()
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

process.on('uncaughtException', (error) => {
  console.error(error)
})
process.on('unhandledRejection', (error) => {
  console.error(error)
})

start()
