export interface CreateBadgeRequest {
    badgeActive: boolean
    badgeDesc: string
    badgeName: string
    badgeStatus: string
    files: FileList
    orgID: string
}
