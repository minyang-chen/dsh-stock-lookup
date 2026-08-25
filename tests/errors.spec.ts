import { describe, it, expect } from 'vitest'
import { guard, success, failure } from '../src/util/errors.ts'
import { stringify } from '../src/util/stringify.ts'

describe('errors', () => {
  it('success wraps data', () => {
    const env = success({ foo: 'bar' })
    expect(env.status).toBe('ok')
    expect(env.data).toEqual({ foo: 'bar' })
  })

  it('failure wraps message', () => {
    const env = failure('something went wrong')
    expect(env.status).toBe('error')
    expect(env.error).toBe('something went wrong')
  })

  it('guard returns success on resolved promise', async () => {
    const result = await guard(async () => success(42))
    expect(result.status).toBe('ok')
    if (result.status === 'ok') expect(result.data).toBe(42)
  })

  it('guard catches thrown errors and returns failure', async () => {
    const result = await guard(async () => {
      throw new Error('boom')
    })
    expect(result.status).toBe('error')
    if (result.status === 'error') expect(result.error).toBe('boom')
  })

  it('guard catches non-Error throws', async () => {
    const result = await guard(async () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'string error'
    })
    expect(result.status).toBe('error')
    if (result.status === 'error') expect(result.error).toBe('string error')
  })
})

describe('stringify', () => {
  it('serializes a success envelope to JSON', () => {
    const json = stringify(success({ price: 150.5 }))
    const parsed = JSON.parse(json)
    expect(parsed.status).toBe('ok')
    expect(parsed.data.price).toBe(150.5)
  })

  it('serializes an error envelope to JSON', () => {
    const json = stringify(failure('not found'))
    const parsed = JSON.parse(json)
    expect(parsed.status).toBe('error')
    expect(parsed.error).toBe('not found')
  })
})
