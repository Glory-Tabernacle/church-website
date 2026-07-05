import { describe, it, expect } from 'vitest'
import { createBookSchema } from '@/lib/validation/book'

describe('Debug Validation', () => {
  it('should show what safeParse returns for empty object', () => {
    const result = createBookSchema.safeParse({})
    if (!result.success) {
    }
  })
})
