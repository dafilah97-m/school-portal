import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requireUser } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'
import { watermarkPdf } from '@/lib/pdf-watermark'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(
  request: NextRequest,
  segmentData: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { user, role } = await requireUser()
    const { resourceId } = await segmentData.params

    const supabase = await createClient()
    const serviceClient = await createServiceClient()

    const { data: resource } = await supabase
      .from('edu_resources')
      .select('*')
      .eq('id', resourceId)
      .maybeSingle()

    if (!resource) throw new ApiError(404, 'Resource not found')

    let licensee: string | null = null

    if (role === 'super_admin') {
      licensee = 'Super Admin Preview'
    } else if (resource.created_by === user.id) {
      licensee = `Preview — ${user.email}`
    } else {
      const { data: purchase } = await supabase
        .from('purchased_resources')
        .select('order_id')
        .eq('user_id', user.id)
        .eq('resource_id', resourceId)
        .maybeSingle()

      if (!purchase) throw new ApiError(403, 'You have not purchased this resource')

      const { data: order } = await supabase
        .from('orders')
        .select('customer_name, grade_class')
        .eq('id', purchase.order_id)
        .maybeSingle()

      licensee = order
        ? `${order.customer_name}${order.grade_class ? ' - ' + order.grade_class : ''}`
        : user.email || 'Licensed user'
    }

    const cachePath = `${resourceId}/${user.id}.pdf`
    const { data: cached } = await serviceClient.storage
      .from('watermarked-cache')
      .download(cachePath)

    let outputBytes: ArrayBuffer

    if (cached) {
      outputBytes = await cached.arrayBuffer()
    } else {
      const { data: original, error: downloadError } = await serviceClient.storage
        .from('private-resources')
        .download(resource.file_url)

      if (downloadError || !original) throw new ApiError(500, 'Could not load the original file')

      const originalBytes = new Uint8Array(await original.arrayBuffer())
      const watermarked = await watermarkPdf(
        originalBytes,
        licensee,
        'SHG Designs School Portal'
      )

      await serviceClient.storage
        .from('watermarked-cache')
        .upload(cachePath, Buffer.from(watermarked), {
          contentType: 'application/pdf',
          upsert: true,
        })

      outputBytes = watermarked.buffer.slice(
        watermarked.byteOffset,
        watermarked.byteOffset + watermarked.byteLength
      ) as ArrayBuffer
    }

    const filename = resource.title.replace(/[^a-z0-9]+/gi, '_') + '.pdf'

    return new NextResponse(Buffer.from(outputBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error downloading resource' }, { status: 500 })
  }
}
