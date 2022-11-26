import { z } from 'zod'

export type JwtPayload = {
  sub: string
}

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string()
  })
  .describe('Login schema')

export const registerSchema = z
  .object({
    name: z.string(),
    email: z.string().email(),
    password: z.string()
  })
  .describe('Register schema')

export const profileResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
  updatedAt: z.string()
})
