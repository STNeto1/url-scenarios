import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { Consumer } from 'sqs-consumer'
import superjson from 'superjson'
import { z } from 'zod'

import { singleUrlSchema } from './modules/routes/url/schemas'

dotenv.config()

const env = z.object({
  AWS_SQS_URL: z.string(),
  DATABASE_URL: z.string()
})

const config = env.safeParse(process.env)
if (!config.success) {
  throw new Error('Invalid config')
}

const prisma = new PrismaClient()

const app = Consumer.create({
  queueUrl: config.data.AWS_SQS_URL,
  handleMessage: async (message) => {
    const body = superjson.parse<z.infer<typeof singleUrlSchema>>(
      message.Body ?? ''
    )

    await prisma.urlAccess.create({
      data: {
        urlId: body.id
      }
    })
  }
})

app.on('error', (err) => {
  console.error(err.message)
})

app.on('processing_error', (err) => {
  console.error(err.message)
})

app.on('message_received', async (message) => {
  await start()
})

const start = async () => {
  await prisma.$connect()

  app.start()
}

start()
  .then(() => console.log('Consumer started'))
  .catch((err) => console.error(err))
