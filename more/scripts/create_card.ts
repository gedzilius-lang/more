import { parseArgs } from 'node:util'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

// Load .env
try {
  const lines = require('fs').readFileSync('.env', 'utf-8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=(.+)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
} catch {}

const { values } = parseArgs({
  options: {
    username:     { type: 'string' },
    email:        { type: 'string' },
    pincode:      { type: 'string' },
    'send-email': { type: 'boolean', default: false },
    'display-name': { type: 'string' },
  },
  strict: true,
})

if (!values.username || !values.email || !values.pincode) {
  console.error('Usage: create_card.ts --username <u> --email <e> --pincode <p> [--send-email] [--display-name <name>]')
  process.exit(1)
}

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) { console.error('DATABASE_URL required'); process.exit(1) }

async function main() {
  const sql = postgres(dbUrl!)
  const db = drizzle(sql)
  const pincodeHash = await bcrypt.hash(values.pincode!, 12)

  const defaultConfig = {
    theme: 'default',
    blocks: [
      { id: uuidv4(), type: 'profile', is_hidden: false,
        data: { display_name: values['display-name'] ?? values.username, title: '', bio: '', avatar_url: null } },
      { id: uuidv4(), type: 'links', is_hidden: false,
        data: { links: [
          { key: uuidv4().slice(0,8), label: 'Instagram', url: 'https://instagram.com/', icon: '' },
          { key: uuidv4().slice(0,8), label: 'Website', url: 'https://', icon: '' },
        ]}},
      { id: uuidv4(), type: 'contact', is_hidden: false,
        data: { items: [{ type: 'email', label: 'Email me', value: values.email }] }},
    ],
  }

  try {
    await db.execute(sql`
      INSERT INTO cards (username, email, pincode_hash, display_name, published, config_json)
      VALUES (${values.username}, ${values.email}, ${pincodeHash},
              ${values['display-name'] ?? values.username}, true, ${JSON.stringify(defaultConfig)})
    `)
    console.log('Card created:', values.username)
  } catch (err: any) {
    if (err.code === '23505') console.error('Username or email already exists')
    else throw err
    await sql.end(); process.exit(1)
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://more.peoplewelike.club'
  console.log('  Public: ' + base + '/more/' + values.username)
  console.log('  Login:  ' + base + '/more/' + values.username + '/login')

  if (values['send-email']) {
    const nodemailer = require('nodemailer')
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT ?? '587'),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    await t.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@peoplewelike.club',
      to: values.email!,
      subject: 'Your PeopleWeLike card is ready',
      text: 'Public: ' + base + '/more/' + values.username + '\nLogin: ' + base + '/more/' + values.username + '/login\nPincode: ' + values.pincode,
    })
    console.log('Email sent to', values.email)
  }

  await sql.end()
}

main().catch(err => { console.error(err); process.exit(1) })
