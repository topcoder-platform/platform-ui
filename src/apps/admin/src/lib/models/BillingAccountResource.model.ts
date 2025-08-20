/**
 * Model for billing account resource info
 */
export interface BillingAccountResource {
  id: number
  name: string
  status: string
  mobileType?: 'label' | 'last-value'
}
