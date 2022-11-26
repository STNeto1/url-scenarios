import * as dotenv from 'dotenv'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { z } from 'zod'

dotenv.config()

const configSchema = z.object({
  DATABASE_URL: z.string().describe('Prisma database URL'),
  JWT_SECRET: z.string().min(1)
})

declare module 'fastify' {
  interface FastifyInstance {
    config: z.infer<typeof configSchema>
  }
}

const configPlugin: FastifyPluginAsync = fp(async (server, options) => {
  const config = configSchema.safeParse(process.env)
  if (!config.success) {
    throw new Error('Invalid config')
  }

  server.decorate('config', config.data)
})

export default configPlugin
