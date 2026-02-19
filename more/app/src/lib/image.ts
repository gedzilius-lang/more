import sharp from 'sharp'
import { createHash } from 'crypto'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? '/data/uploads'
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png'])
const MAX_BYTES = 10 * 1024 * 1024

const MAGIC: Record<string, Buffer> = {
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
  'image/png':  Buffer.from([0x89, 0x50, 0x4e, 0x47]),
}

function checkMagic(buf: Buffer): string | null {
  for (const [mime, magic] of Object.entries(MAGIC)) {
    if (buf.subarray(0, magic.length).equals(magic)) return mime
  }
  return null
}

export async function processUpload(cardId: string, buffer: Buffer, originalMime: string) {
  if (buffer.length > MAX_BYTES) return { error: 'File too large (max 10MB)' }
  const detectedMime = checkMagic(buffer)
  if (!detectedMime || !ALLOWED_MIME.has(detectedMime)) return { error: 'Only PNG and JPEG allowed' }

  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16)
  const dir = path.join(UPLOAD_DIR, cardId)
  await fs.mkdir(dir, { recursive: true })

  const sizes = [256, 512, 1024]
  const variants: Record<string, string> = {}
  for (const size of sizes) {
    const filename = `${hash}-${size}.jpg`
    const filePath = path.join(dir, filename)
    await sharp(buffer).resize(size, size, { fit: 'cover' }).rotate().jpeg({ quality: 85 }).toFile(filePath)
    variants[`${size}`] = `/uploads/${cardId}/${filename}`
  }
  return { variants }
}
