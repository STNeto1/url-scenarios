import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { createClient, RedisClientType } from 'redis'

declare module 'fastify' {
  interface FastifyInstance {
    redis: RedisClientType
  }
}

const redisPlugin: FastifyPluginAsync = fp(async (server, options) => {
  const client = createClient({
    url: server.config.REDIS_URL
  })

  client.on('error', (err) => console.log('Redis Client Error', err))

  await client.connect()

  server.decorate('redis', client)
})

export default redisPlugin
