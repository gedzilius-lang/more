import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!
const globalForPg = global as unknown as { pgClient: ReturnType<typeof postgres> }
const client = globalForPg.pgClient ?? postgres(connectionString, { max: 10 })
if (process.env.NODE_ENV !== 'production') globalForPg.pgClient = client
export const db = drizzle(client, { schema })
export { schema }
