import { NextRequest, NextResponse } from 'next/server'
import { finalizeDpoPayment } from '@/lib/dpo-finalize'

// Hit by DPO's server-to-server payment notification (if configured in the
// DPO back office). Not gated by the RBAC proxy — DPO is not an
// authenticated app user, so ownership is irrelevant here; the DPO
// CompanyToken embedded in verifyToken is what authenticates this call.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('TransactionToken')
  if (!token) {
    return NextResponse.json({ error: 'Missing TransactionToken' }, { status: 400 })
  }
  const { success } = await finalizeDpoPayment(token)
  return NextResponse.json({ success })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
