import { beforeEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import { vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'

const prisma = mockDeep<PrismaClient>()

vi.mock('../../lib/prisma.js', () => ({ prisma }))

beforeEach(() => {
  mockReset(prisma)
})

export { prisma }
