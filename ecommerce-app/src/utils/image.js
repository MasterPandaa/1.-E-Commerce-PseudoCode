// PSEUDO: Image utility for magic bytes validation
import { fileTypeFromBuffer } from 'file-type'

const allowed = ['image/jpeg', 'image/png', 'image/webp']

export async function isValidImageMagicBytes (buffer) {
  const ft = await fileTypeFromBuffer(buffer)
  if (!ft) return false
  return allowed.includes(ft.mime)
}

export function getExtensionFromMime (mime) {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'bin'
  }
}
