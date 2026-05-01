import { z } from 'zod'

export const MovieListInputSchema = z.object({
  search: z.string().optional(),
  genre: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export const MovieByIdInputSchema = z.object({
  id: z.string().min(1),
})

export type MovieListInput = z.infer<typeof MovieListInputSchema>
export type MovieByIdInput = z.infer<typeof MovieByIdInputSchema>
