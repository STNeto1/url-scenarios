import * as dotenv from 'dotenv'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { z } from 'zod'

dotenv.config()

const configSchema = z.object({
  DATABASE_URL: z.string().describe('Prisma database URL'),
  JWT_SECRET: z.string().min(1),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  REDIS_URL: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_DEFAULT_REGION: z.string(),
  AWS_SQS_URL: z.string()
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
