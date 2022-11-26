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
import {
  JwtPayload,
  loginSchema,
  profileResponseSchema,
  registerSchema
} from './schemas'

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

        const token = server.jwt.sign({
          sub: user.id
        })

        return reply.send({ token })
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

        const token = server.jwt.sign({
          sub: user.id
        })

        return reply.send({ token })
      }
    })

    server.route({
      url: '/auth/profile',
      logLevel: 'warn',
      method: ['GET'],
      onRequest: [server.authenticate],
      schema: {
        response: {
          200: zodToJsonSchema(profileResponseSchema, 'profileResponseSchema')
        }
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        const payload = request.user as JwtPayload

        const user = await server.prisma.user.findUnique({
          where: {
            id: payload.sub
          }
        })

        if (!user) {
          return reply.status(401).send({
            message: 'Unauthorized'
          })
        }

        return reply.send(user)
      }
    })

    next()
  }
)
