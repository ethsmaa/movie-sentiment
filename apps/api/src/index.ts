import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from './router/index.js'
import { createContext } from './context.js'
import { PORT, CORS_ORIGIN } from './lib/constants.js'

const app = new Hono()

app.use('*', cors({ origin: CORS_ORIGIN, credentials: true }))

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.all('/trpc/*', (c) =>
  fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext,
  }),
)

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`API running on http://localhost:${info.port}`)
})
