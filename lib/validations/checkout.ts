import { z } from 'zod'

export const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Enter the student/parent full name'),
  customer_email: z.string().email('Enter a valid email address'),
  grade_class: z.string().min(1, 'Grade and section are required for sorting'),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
