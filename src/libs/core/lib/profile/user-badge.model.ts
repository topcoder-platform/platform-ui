export type UserBadge = {
    awarded_at: Date
    awarded_by: string
    org_badge: {
        id: string
        active: boolean
        badge_description: string
        badge_image_url: string
        badge_name: string
        badge_status: string
        orgranization: {
            id: string
            name: string
        }
        organization_id: string
        tags_id_tags: string[]
    }
    org_badge_id: string
    user_handle: string
    user_id: string
}
