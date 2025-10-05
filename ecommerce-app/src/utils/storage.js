// PSEUDO: Storage utilities for saving uploaded files safely
import fs from 'fs/promises'
import path from 'path'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'
import { getExtensionFromMime } from './image.js'

export function generateSafeFilename (originalname, mime) {
  const ext = getExtensionFromMime(mime)
  const id = uuidv4()
  return `${id}.${ext}`
}

export function productsUploadDir () {
  const now = dayjs()
  return path.join('uploads', 'products', now.format('YYYY'), now.format('MM'))
}

export async function saveBufferToFile (buffer, destRelativeDir, filename) {
  const root = process.cwd()
  const destDir = path.join(root, destRelativeDir)
  await fs.mkdir(destDir, { recursive: true })
  const fullPath = path.join(destDir, filename)
  await fs.writeFile(fullPath, buffer)
  const publicUrl = `/${destRelativeDir.replace(/\\/g, '/').replace(/\s/g, '%20')}/${filename}`
  return { path: fullPath, url: publicUrl }
}
