import type { Screening } from '../models'

import { selectVisibleScreeningRows } from './screeningRows'

const screeningRows = [
    { submissionId: 'member-one-oldest' },
    { submissionId: 'member-one-middle' },
    { submissionId: 'member-one-latest' },
    { submissionId: 'member-two-oldest' },
    { submissionId: 'member-two-middle' },
    { submissionId: 'member-two-latest' },
] as Screening[]

describe('selectVisibleScreeningRows', () => {
    it('retains every row for an unlimited challenge', () => {
        const result = selectVisibleScreeningRows({
            latestSubmissionIds: new Set(),
            screeningRows,
        })

        expect(result.isRestrictedToLatest)
            .toBe(false)
        expect(result.rows)
            .toBe(screeningRows)
    })

    it('retains the latest two selected rows per member for a finite count of two', () => {
        const result = selectVisibleScreeningRows({
            latestSubmissionIds: new Set([
                'member-one-middle',
                'member-one-latest',
                'member-two-middle',
                'member-two-latest',
            ]),
            screeningRows,
            submissionLimit: 2,
        })

        expect(result.isRestrictedToLatest)
            .toBe(true)
        expect(result.rows)
            .toEqual([
                screeningRows[1],
                screeningRows[2],
                screeningRows[4],
                screeningRows[5],
            ])
    })

    it('retains only the selected latest row for a finite count of one', () => {
        const result = selectVisibleScreeningRows({
            latestSubmissionIds: new Set([
                'member-one-latest',
                'member-two-latest',
            ]),
            screeningRows,
            submissionLimit: 1,
        })

        expect(result.isRestrictedToLatest)
            .toBe(true)
        expect(result.rows)
            .toEqual([
                screeningRows[2],
                screeningRows[5],
            ])
    })
})
