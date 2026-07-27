import { createClient } from '@/lib/supabase-server'

export interface FulfillmentRow {
  student: string
  gradeClass: string
  product: string
  size: string
  quantity: number
  customization: string
}

interface FulfillmentOrderItem {
  quantity: number
  selected_size: string | null
  custom_text: string | null
  product_id: string | null
  products: { title: string; store_id: string } | null
}

interface FulfillmentOrder {
  customer_name: string
  grade_class: string | null
  payment_status: string
  order_items: FulfillmentOrderItem[]
}

// Shared by the CSV and PDF export routes — one paid order can produce
// multiple rows (one per line item), grouped by grade/class for factory
// production sorting.
export async function loadFulfillmentRows(storeId?: string): Promise<FulfillmentRow[]> {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('customer_name, grade_class, payment_status, order_items(quantity, selected_size, custom_text, product_id, products(title, store_id))')
    .eq('payment_status', 'paid')

  const rows: FulfillmentRow[] = []

  for (const order of (orders ?? []) as unknown as FulfillmentOrder[]) {
    for (const item of order.order_items ?? []) {
      if (!item.product_id || !item.products) continue // fulfillment list is merch-only
      if (storeId && item.products.store_id !== storeId) continue

      rows.push({
        student: order.customer_name,
        gradeClass: order.grade_class || '—',
        product: item.products.title,
        size: item.selected_size || '—',
        quantity: item.quantity,
        customization: item.custom_text || '',
      })
    }
  }

  rows.sort((a, b) => a.gradeClass.localeCompare(b.gradeClass) || a.student.localeCompare(b.student))

  return rows
}
