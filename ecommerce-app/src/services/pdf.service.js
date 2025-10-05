// PSEUDO: PDF invoice generation
import PDFDocument from 'pdfkit'
import fs from 'fs/promises'
import { createWriteStream } from 'fs'
import path from 'path'
import dayjs from 'dayjs'

export async function generateInvoice (order, items) {
  const invoicesDir = path.join(process.cwd(), 'invoices')
  await fs.mkdir(invoicesDir, { recursive: true })
  const filePath = path.join(invoicesDir, `${order.id}.pdf`)

  return await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = doc.pipe(createWriteStream(filePath))

    doc.fontSize(20).text(`Invoice #${order.id}`, { align: 'right' })
    doc.moveDown()

    doc.fontSize(12).text('Shipping Address:', { underline: true })
    doc.text(order.shipping_name)
    doc.text(order.shipping_line1)
    if (order.shipping_line2) doc.text(order.shipping_line2)
    doc.text(`${order.shipping_city}, ${order.shipping_postal}`)
    doc.text(order.shipping_country)

    doc.moveDown()
    doc.text(`Date: ${dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}`)

    doc.moveDown()
    doc.fontSize(12).text('Items:', { underline: true })

    items.forEach((it) => {
      doc.text(
        `- Product ${it.product_id} x ${it.quantity} @ $${Number(it.unit_price).toFixed(2)} = $${(Number(it.unit_price) * it.quantity).toFixed(2)}`
      )
    })

    doc.moveDown()
    doc.text(`Subtotal: $${Number(order.subtotal).toFixed(2)}`)
    doc.text(`Tax: $${Number(order.tax).toFixed(2)}`)
    doc.text(`Shipping: $${Number(order.shipping).toFixed(2)}`)
    doc.text(`Total: $${Number(order.total).toFixed(2)}`, { underline: true })

    doc.end()
    stream.on('finish', () => resolve({ filePath }))
    stream.on('error', reject)
  })
}
