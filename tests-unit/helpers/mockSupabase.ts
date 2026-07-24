export type QueryResult = { data?: unknown; error?: unknown }
export type RecordedCall = { table: string; method: string; args: unknown[] }

export interface MockQueryBuilder extends PromiseLike<QueryResult> {
  select: (...args: unknown[]) => MockQueryBuilder
  insert: (...args: unknown[]) => MockQueryBuilder
  upsert: (...args: unknown[]) => MockQueryBuilder
  update: (...args: unknown[]) => MockQueryBuilder
  delete: (...args: unknown[]) => MockQueryBuilder
  eq: (...args: unknown[]) => MockQueryBuilder
  neq: (...args: unknown[]) => MockQueryBuilder
  in: (...args: unknown[]) => MockQueryBuilder
  ilike: (...args: unknown[]) => MockQueryBuilder
  like: (...args: unknown[]) => MockQueryBuilder
  order: (...args: unknown[]) => MockQueryBuilder
  limit: (...args: unknown[]) => MockQueryBuilder
  range: (...args: unknown[]) => MockQueryBuilder
  is: (...args: unknown[]) => MockQueryBuilder
  not: (...args: unknown[]) => MockQueryBuilder
  single: (...args: unknown[]) => Promise<QueryResult>
  maybeSingle: (...args: unknown[]) => Promise<QueryResult>
}

const CHAIN_METHODS = [
  'select',
  'insert',
  'upsert',
  'update',
  'delete',
  'eq',
  'neq',
  'in',
  'ilike',
  'like',
  'order',
  'limit',
  'range',
  'is',
  'not',
]
const TERMINAL_METHODS = ['single', 'maybeSingle']

export function createMockSupabase(handlers: Record<string, QueryResult | QueryResult[]> = {}) {
  const calls: RecordedCall[] = []
  const queues: Record<string, QueryResult[]> = {}
  const reusable: Record<string, boolean> = {}
  for (const [table, val] of Object.entries(handlers)) {
    queues[table] = Array.isArray(val) ? [...val] : [val]
    reusable[table] = !Array.isArray(val)
  }

  const resolveFor = (table: string): QueryResult => {
    const q = queues[table]
    if (!q || q.length === 0) return { data: null, error: null }
    if (reusable[table]) return q[0]
    return q.shift() as QueryResult
  }

  const makeBuilder = (table: string): MockQueryBuilder => {
    const builder: Record<string, unknown> = {}
    for (const m of CHAIN_METHODS) {
      builder[m] = (...args: unknown[]) => {
        calls.push({ table, method: m, args })
        return builder
      }
    }
    for (const m of TERMINAL_METHODS) {
      builder[m] = (...args: unknown[]) => {
        calls.push({ table, method: m, args })
        return Promise.resolve(resolveFor(table))
      }
    }
    builder.then = (
      onFulfilled: (v: QueryResult) => unknown,
      onRejected?: (e: unknown) => unknown,
    ) => Promise.resolve(resolveFor(table)).then(onFulfilled, onRejected)
    return builder as unknown as MockQueryBuilder
  }

  const supabase = {
    from(table: string): MockQueryBuilder {
      calls.push({ table, method: 'from', args: [] })
      return makeBuilder(table)
    },
    auth: {
      verifyOtp: async (...args: unknown[]) => {
        calls.push({ table: '__auth__', method: 'verifyOtp', args })
        return resolveFor('__auth__')
      },
      exchangeCodeForSession: async (...args: unknown[]) => {
        calls.push({ table: '__auth__', method: 'exchangeCodeForSession', args })
        return resolveFor('__auth__')
      },
    },
  }

  return { supabase, calls }
}

export function formRequest(fields: Record<string, string | string[] | File>): Request {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) v.forEach((x) => fd.append(k, x as string))
    else fd.append(k, v as string)
  }
  return { formData: async () => fd } as unknown as Request
}

export function jsonRequest(body: unknown): Request {
  return { json: async () => body } as unknown as Request
}

export type MockSupabase = ReturnType<typeof createMockSupabase>['supabase']
const withUser = (supabase: MockSupabase, user: unknown) => ({ supabase, user }) as never
export const adminLocals = (supabase: MockSupabase) => withUser(supabase, { player_role: 'ADMIN' })
export const playerLocals = (supabase: MockSupabase) =>
  withUser(supabase, { player_role: 'PLAYER' })
export const anonLocals = (supabase: MockSupabase) => withUser(supabase, null)
