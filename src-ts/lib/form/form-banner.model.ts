export interface FormBannerModel {
  readonly backgroundColor: string
  readonly description: string
  dirty?: boolean
  readonly isStatic?: boolean
  readonly name: string
  readonly notTabbable: boolean
  open: boolean
  readonly title: string
  touched?: boolean
  readonly type: 'banner'
}
