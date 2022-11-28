import { FastifyPluginAsync } from 'fastify'
import metrics from 'fastify-metrics'
import fp from 'fastify-plugin'

const metricsPlugin: FastifyPluginAsync = fp(async (server, options) => {
  server.register(metrics, {
    endpoint: '/metrics'
  })
})

export default metricsPlugin
