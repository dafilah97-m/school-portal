export type Role = 'super_admin' | 'shop_admin' | 'subject_admin' | 'student_parent'

export type ResourceStatus = 'draft' | 'pending_approval' | 'published' | 'rejected'
export type PaymentStatus = 'pending' | 'paid' | 'failed'
export type FulfillmentStatus = 'unfulfilled' | 'processing' | 'delivered'
export type Occupation = 'student' | 'teacher' | 'parent'
export type TeacherReviewStatus = 'pending' | 'approved' | 'dismissed'

export interface Profile {
  id: string
  email: string
  role: Role
  assigned_subject: string | null
  full_name: string | null
  phone: string | null
  id_number: string | null
  occupation: Occupation | null
  teacher_subject: string | null
  avatar_url: string | null
  teacher_review_status: TeacherReviewStatus | null
  created_at: string
}

export interface CampaignStore {
  id: string
  school_name: string
  slug: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
}

export interface CustomizationField {
  label: string
  type: 'text' | 'number'
  required?: boolean
}

export interface Product {
  id: string
  store_id: string
  title: string
  description: string | null
  price: number
  fundraising_markup: number
  sizes: string[]
  customization_fields: CustomizationField[]
  images: string[]
  is_active: boolean
  created_at: string
}

export interface EduResource {
  id: string
  title: string
  subject: string
  grade_level: string | null
  year: number | null
  price: number
  file_url: string
  status: ResourceStatus
  rejection_comment: string | null
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

export interface EduResourcePublic {
  id: string
  title: string
  subject: string
  grade_level: string | null
  year: number | null
  price: number
  created_at: string
}

export interface EducationalVideo {
  id: string
  title: string
  description: string | null
  video_url: string
  subject: string | null
  status: ResourceStatus
  rejection_comment: string | null
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

export interface NewsEvent {
  id: string
  title: string
  body: string
  event_date: string | null
  status: ResourceStatus
  rejection_comment: string | null
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

export interface Order {
  id: string
  user_id: string | null
  customer_name: string
  customer_email: string
  grade_class: string | null
  total_amount: number
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus
  dpo_trans_token: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  resource_id: string | null
  quantity: number
  selected_size: string | null
  custom_text: string | null
  price_at_purchase: number
}

export interface PurchasedResource {
  id: string
  user_id: string
  resource_id: string
  order_id: string | null
  purchase_date: string
}
