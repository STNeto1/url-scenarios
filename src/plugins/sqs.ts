import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import superjson from 'superjson'

declare module 'fastify' {
  interface FastifyInstance {
    sqs: SQSClient
  }
}

const sqsPlugin: FastifyPluginAsync = fp(async (server, options) => {
  const client = new SQSClient({
    region: server.config.AWS_DEFAULT_REGION,
    credentials: {
      accessKeyId: server.config.AWS_ACCESS_KEY_ID,
      secretAccessKey: server.config.AWS_SECRET_ACCESS_KEY
    }
  })

  console.log(client)

  server.decorate('sqs', client)
})

export default sqsPlugin

export const sendUrlAccessMessage = async (
  client: SQSClient,
  url: unknown
): Promise<void> => {
  const command = new SendMessageCommand({
    MessageBody: superjson.stringify(url),
    QueueUrl: process.env.AWS_SQS_URL
  })

  await client.send(command)
}
