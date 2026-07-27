import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'

// Stamps "Licensed to {name} — {school}" diagonally across every page.
// Runs synchronously inside the download request — no background workers
// in a serverless Next.js deployment — with the result cached by the caller
// so repeat downloads skip this step entirely.
export async function watermarkPdf(
  originalBytes: Uint8Array,
  licensee: string,
  schoolName: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes)
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const label = `Licensed to ${licensee} — ${schoolName}`

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize()
    const fontSize = 16
    const textWidth = font.widthOfTextAtSize(label, fontSize)

    page.drawText(label, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.35,
      rotate: degrees(45),
    })

    // small footer stamp too, in case the diagonal is cropped when printed
    page.drawText(label, {
      x: 24,
      y: 16,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
      opacity: 0.6,
    })
  }

  return pdfDoc.save()
}
