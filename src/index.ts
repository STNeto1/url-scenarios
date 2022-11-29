import { fastify, FastifyInstance } from 'fastify'
import fastifyBlipp from 'fastify-blipp'
import { IncomingMessage, Server, ServerResponse } from 'http'

import authRoutes from './modules/routes/auth'
import statusRoutes from './modules/routes/status'
import urlRoutes from './modules/routes/url'
import configPlugin from './plugins/config'
import jwtPlugin from './plugins/jwt'
import metricsPlugin from './plugins/metrics'
import prismaPlugin from './plugins/prisma'
import redisPlugin from './plugins/redis'
import sqsPlugin from './plugins/sqs'
import { getPort } from './utils/get-port'

const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
  fastify({ logger: true })

server.register(configPlugin)
server.register(prismaPlugin)
server.register(jwtPlugin)
server.register(redisPlugin)
server.register(metricsPlugin)
server.register(sqsPlugin)
server.register(fastifyBlipp)

server.register(statusRoutes)
server.register(authRoutes)
server.register(urlRoutes)

const start = async () => {
  try {
    await server.listen({
      port: getPort(3000),
      host: '0.0.0.0'
    })

    if (server.config.NODE_ENV !== 'production') {
      server.blipp()
    }
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
