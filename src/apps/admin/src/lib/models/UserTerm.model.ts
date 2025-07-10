/**
 * Model for user term info
 */
export interface UserTerm {
    id: string
    legacyId: number
    title: string
    url: string
    agreeabilityTypeId: string
    typeId: number
    agreeabilityType: string
    type: string
    docusignTemplateId?: string
    text?: string
}
