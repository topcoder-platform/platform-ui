export interface FormBannerModel {
  readonly id?: string
  readonly type: 'banner'
  readonly name?: string
  readonly description: string
  readonly title: string
  readonly backgroundColor: string
  open: boolean
}