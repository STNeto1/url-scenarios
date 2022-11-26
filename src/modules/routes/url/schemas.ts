import { z } from 'zod'

export const createUrlSchema = z.object({
  url: z.string().url()
})

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
})

export const singleUrlSchema = z.object({
  id: z.string(),
  url: z.string(),
  hash: z.string(),
  createdAt: z.string()
})

export const urlListSchema = z.object({
  pages: z.number(),
  data: z.array(singleUrlSchema)
})

export const deleteUrlSchema = z.object({
  id: z.string()
})

export const findUrlSchema = z.object({
  hash: z.string()
})
