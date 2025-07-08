export interface BackendResourceRole {
    id: string
    name: string
    legacyId?: number
    fullReadAccess: boolean
    fullWriteAccess: boolean
    isActive: boolean
    selfObtainable: boolean
}
