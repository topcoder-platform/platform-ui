import type { Screening, SubmissionInfo } from '../models'

import { selectVisibleScreeningRows } from './screeningRows'

const screeningRows = [
    { submissionId: 'member-one-old' },
    { submissionId: 'member-one-latest' },
    { submissionId: 'member-two-old' },
    { submissionId: 'member-two-latest' },
] as Screening[]

const latestSubmissionIds = new Set([
    'member-one-latest',
    'member-two-latest',
])

describe('selectVisibleScreeningRows', () => {
    it('retains every row for an unlimited challenge without latest flags', () => {
        const result = selectVisibleScreeningRows({
            hasSubmissionLimit: false,
            latestSubmissionIds,
            screeningRows,
            submissionInfos: [{}, {}, {}, {}],
        })

        expect(result.isRestrictedToLatest)
            .toBe(false)
        expect(result.rows)
            .toBe(screeningRows)
    })

    it('retains every row for an unlimited challenge with stale latest flags', () => {
        const submissionInfos: Array<Pick<SubmissionInfo, 'isLatest'>> = [
            { isLatest: false },
            { isLatest: true },
            { isLatest: false },
            { isLatest: true },
        ]

        const result = selectVisibleScreeningRows({
            hasSubmissionLimit: false,
            latestSubmissionIds,
            screeningRows,
            submissionInfos,
        })

        expect(result.isRestrictedToLatest)
            .toBe(false)
        expect(result.rows)
            .toBe(screeningRows)
    })

    it('retains every row for a limited challenge without explicit latest flags', () => {
        const result = selectVisibleScreeningRows({
            hasSubmissionLimit: true,
            latestSubmissionIds,
            screeningRows,
            submissionInfos: [{}, {}, {}, {}],
        })

        expect(result.isRestrictedToLatest)
            .toBe(false)
        expect(result.rows)
            .toBe(screeningRows)
    })

    it('retains only explicit latest submissions for a limited challenge', () => {
        const submissionInfos: Array<Pick<SubmissionInfo, 'isLatest'>> = [
            { isLatest: false },
            { isLatest: true },
            { isLatest: false },
            { isLatest: true },
        ]

        const result = selectVisibleScreeningRows({
            hasSubmissionLimit: true,
            latestSubmissionIds,
            screeningRows,
            submissionInfos,
        })

        expect(result.isRestrictedToLatest)
            .toBe(true)
        expect(result.rows)
            .toEqual([
                screeningRows[1],
                screeningRows[3],
            ])
    })
})
