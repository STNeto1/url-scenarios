import argon2 from 'argon2'
import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest
} from 'fastify'
import fp from 'fastify-plugin'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'

const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string()
  })
  .describe('Login schema')

const registerSchema = z
  .object({
    name: z.string(),
    email: z.string().email(),
    password: z.string()
  })
  .describe('Register schema')

export default fp(
  async (server: FastifyInstance, _: FastifyPluginOptions, next: Function) => {
    server.route({
      url: '/auth/login',
      logLevel: 'warn',
      method: ['POST'],
      schema: {
        body: zodToJsonSchema(loginSchema, 'loginSchema')
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as z.infer<typeof loginSchema>

        const user = await server.prisma.user.findUnique({
          where: {
            email: body.email
          }
        })

        if (!user) {
          return reply.status(401).send({
            message: 'Invalid credentials'
          })
        }

        const valid = await argon2.verify(user.password, body.password)
        if (!valid) {
          return reply.status(401).send({
            message: 'Invalid credentials'
          })
        }

        return reply.send(user)
      }
    })

    server.route({
      url: '/auth/register',
      logLevel: 'warn',
      method: ['POST'],
      schema: {
        body: zodToJsonSchema(registerSchema, 'registerSchema')
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as z.infer<typeof registerSchema>

        const existingUser = await server.prisma.user.findUnique({
          where: {
            email: body.email
          }
        })

        if (existingUser) {
          return reply.status(401).send({
            message: 'Email already in use'
          })
        }

        const user = await server.prisma.user.create({
          data: {
            name: body.name,
            email: body.email,
            password: await argon2.hash(body.password)
          }
        })

        return reply.send(user)
      }
    })

    next()
  }
)
