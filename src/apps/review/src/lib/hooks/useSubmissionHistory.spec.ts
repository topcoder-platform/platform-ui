/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { act, renderHook } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'

import type { SubmissionInfo } from '../models'
import { getChallengeSubmissionSelectionLimit } from '../utils/challenge'

import { useSubmissionHistory, UseSubmissionHistoryResult } from './useSubmissionHistory'

const submissions: SubmissionInfo[] = [
    {
        id: 'latest-submission',
        isLatest: true,
        memberId: 'member-1',
        submittedDate: '2026-09-07T12:00:00.000Z',
        type: 'CONTEST_SUBMISSION',
    },
    {
        id: 'older-submission',
        isLatest: false,
        memberId: 'member-1',
        submittedDate: '2026-09-07T11:00:00.000Z',
        type: 'CONTEST_SUBMISSION',
    },
    {
        id: 'oldest-submission',
        isLatest: false,
        memberId: 'member-1',
        submittedDate: '2026-09-07T10:00:00.000Z',
        type: 'CONTEST_SUBMISSION',
    },
]
const unlimited = JSON.stringify({ count: '', limit: 'false', unlimited: 'true' })
const limited = JSON.stringify({ count: '2', limit: 'true', unlimited: 'false' })

describe('useSubmissionHistory for reviewer and submitter tables', () => {
    it.each([unlimited, undefined])('hides history for unlimited Design metadata %s', value => {
        const { result }: RenderHookResult<UseSubmissionHistoryResult, unknown> = renderHook(
            () => useSubmissionHistory({
                datas: submissions,
                filteredAll: submissions,
                isSubmissionTab: true,
                maxVisibleSubmissions: getChallengeSubmissionSelectionLimit({
                    metadata: value ? [{ name: 'submissionLimit', value }] : [],
                    track: { id: 'design-track', name: 'Design' },
                }),
            }),
        )

        expect(result.current.shouldShowHistoryActions)
            .toBe(false)
    })

    it.each([
        ['Design', limited, ['oldest-submission']],
        ['Development', unlimited, ['older-submission', 'oldest-submission']],
        ['Data Science', unlimited, ['older-submission', 'oldest-submission']],
        ['Quality Assurance', unlimited, ['older-submission', 'oldest-submission']],
    ])('keeps history available and usable for %s', (track, value, expectedHistoryIds) => {
        const { result }: RenderHookResult<UseSubmissionHistoryResult, unknown> = renderHook(
            () => useSubmissionHistory({
                datas: submissions,
                filteredAll: submissions,
                isSubmissionTab: true,
                maxVisibleSubmissions: getChallengeSubmissionSelectionLimit({
                    metadata: [{ name: 'submissionLimit', value: value as string }],
                    track: { id: 'track-1', name: track as string },
                }),
            }),
        )

        expect(result.current.shouldShowHistoryActions)
            .toBe(true)

        act(() => {
            result.current.openHistoryModal('member-1', 'latest-submission')
        })

        expect(result.current.historyEntriesForModal.map(entry => entry.id))
            .toEqual(expectedHistoryIds)

        act(() => {
            result.current.closeHistoryModal()
        })

        expect(result.current.historyKey)
            .toBeUndefined()
    })
})
