export interface BackendLegacy {
    reviewType: string
    confidentialityType: string
    forumId?: number
    directProjectId: number
    screeningScorecardId?: number
    reviewScorecardId?: number
    isTask: boolean
    useSchedulingAPI: boolean
    pureV5Task: boolean
    pureV5: boolean
    selfService: boolean
    selfServiceCopilot: any
    track?: string
    subTrack?: string
    legacySystemId?: number
}
