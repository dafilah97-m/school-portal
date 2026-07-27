import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'
import { loadFulfillmentRows } from '@/lib/fulfillment-list'

const COLUMNS = [
  { label: 'Student', width: 140 },
  { label: 'Grade/Class', width: 80 },
  { label: 'Product', width: 130 },
  { label: 'Size', width: 40 },
  { label: 'Qty', width: 30 },
  { label: 'Customization', width: 100 },
]

export async function GET(request: NextRequest) {
  try {
    await requireRole('shop_admin', 'super_admin')
    const storeId = request.nextUrl.searchParams.get('store_id') || undefined
    const rows = await loadFulfillmentRows(storeId)

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const pageWidth = 612 // US Letter, landscape-ish margins
    const pageHeight = 792
    const margin = 36
    const rowHeight = 18
    const fontSize = 9

    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = pageHeight - margin

    function drawHeader() {
      let x = margin
      for (const col of COLUMNS) {
        page.drawText(col.label, { x, y, size: fontSize, font: bold, color: rgb(0, 0, 0) })
        x += col.width
      }
      y -= rowHeight
      page.drawLine({
        start: { x: margin, y: y + 6 },
        end: { x: pageWidth - margin, y: y + 6 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      })
    }

    page.drawText('Fulfillment print list', { x: margin, y, size: 14, font: bold })
    y -= 24
    drawHeader()

    for (const row of rows) {
      if (y < margin + rowHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        y = pageHeight - margin
        drawHeader()
      }

      let x = margin
      const values = [row.student, row.gradeClass, row.product, row.size, String(row.quantity), row.customization]
      values.forEach((value, i) => {
        const truncated = value.length > 28 ? value.slice(0, 25) + '...' : value
        page.drawText(truncated, { x, y, size: fontSize, font })
        x += COLUMNS[i].width
      })
      y -= rowHeight
    }

    const bytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="fulfillment-list.pdf"',
      },
    })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error exporting PDF' }, { status: 500 })
  }
}
