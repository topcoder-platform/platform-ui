// TODO: add factory to convert snake case property names to camel case
export interface GameBadge {
  active: boolean
  badge_description: string
  badge_image_url: string
  badge_name: string
  badge_status: string
  id: string
  member_badges?: Array<{
    awarded_at: string,
    awarded_by: string,
    user_handle: string,
    user_id: string,
  }>
  organization_id: string
}
