import { httpBatchLink } from '@trpc/client'
import { QueryClient } from '@tanstack/react-query'
import { trpc } from './trpc'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/trpc',
    }),
  ],
})
