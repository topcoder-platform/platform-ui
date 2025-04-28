export interface Screening {
    challengeId: string
    submissionId: string
    createdAt: string | Date
    createdAtString?: string // this field is calculated at frontend
    handle: string
    handleColor: string
    screenerHandle: string
    screenerHandleColor: string
    score: number
    result: 'PASS' | 'NO PASS'
}
