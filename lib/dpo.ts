import { XMLBuilder, XMLParser } from 'fast-xml-parser'

const DPO_API_URL = process.env.DPO_API_URL || 'https://secure.3gdirectpay.com/API/v6/'
const COMPANY_TOKEN = process.env.DPO_COMPANY_TOKEN!
const SERVICE_TYPE = process.env.DPO_SERVICE_TYPE!

const builder = new XMLBuilder({ format: false })
const parser = new XMLParser()

export interface DpoCreateTokenParams {
  orderId: string
  amount: number
  currency?: string
  customerName: string
  customerEmail: string
  redirectUrl: string
  backUrl: string
  description: string
}

export interface DpoCreateTokenResult {
  result: string
  explanation: string
  transToken?: string
  transRef?: string
}

// Creates a DPO payment token and returns the hosted-page redirect URL.
// Docs: DPO Pay API v6 — createToken / Token API (XML over HTTPS POST).
export async function createToken(params: DpoCreateTokenParams): Promise<DpoCreateTokenResult> {
  const today = new Date().toISOString().slice(0, 10).split('-').reverse().join('/') // DD/MM/YYYY

  const xml = builder.build({
    API3G: {
      CompanyToken: COMPANY_TOKEN,
      Request: 'createToken',
      Transaction: {
        PaymentAmount: params.amount.toFixed(2),
        PaymentCurrency: params.currency || 'BWP',
        CompanyRef: params.orderId,
        RedirectURL: params.redirectUrl,
        BackURL: params.backUrl,
        CompanyRefUnique: 0,
        PTL: 5,
        customerFirstName: params.customerName,
        customerEmail: params.customerEmail,
      },
      Services: {
        Service: {
          ServiceType: SERVICE_TYPE,
          ServiceDescription: params.description,
          ServiceDate: today,
        },
      },
    },
  })

  const res = await fetch(DPO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xml,
  })

  const parsed = parser.parse(await res.text())
  const body = parsed.API3G ?? {}

  return {
    result: String(body.Result ?? ''),
    explanation: String(body.ResultExplanation ?? ''),
    transToken: body.TransToken ? String(body.TransToken) : undefined,
    transRef: body.TransRef ? String(body.TransRef) : undefined,
  }
}

export function hostedPaymentUrl(transToken: string) {
  return `https://secure.3gdirectpay.com/payv2.php?ID=${transToken}`
}

export interface DpoVerifyResult {
  result: string
  explanation: string
  approved: boolean
  amount?: string
  currency?: string
  companyRef?: string
}

// Authoritative payment check — never trust redirect query params alone.
export async function verifyToken(transToken: string): Promise<DpoVerifyResult> {
  const xml = builder.build({
    API3G: {
      CompanyToken: COMPANY_TOKEN,
      Request: 'verifyToken',
      TransactionToken: transToken,
    },
  })

  const res = await fetch(DPO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xml,
  })

  const parsed = parser.parse(await res.text())
  const body = parsed.API3G ?? {}
  const result = String(body.Result ?? '')

  return {
    result,
    explanation: String(body.ResultExplanation ?? ''),
    approved: result === '000',
    amount: body.TransactionAmount ? String(body.TransactionAmount) : undefined,
    currency: body.TransactionCurrency ? String(body.TransactionCurrency) : undefined,
    companyRef: body.CompanyRef ? String(body.CompanyRef) : undefined,
  }
}
