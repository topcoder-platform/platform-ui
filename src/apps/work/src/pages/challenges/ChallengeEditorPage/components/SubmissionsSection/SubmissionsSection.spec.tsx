/* eslint-disable global-require, import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import type {
    Challenge,
    Submission,
} from '../../../../../lib/models'

import { SubmissionsSection } from './SubmissionsSection'

const mockUseDownloadAllSubmissions = jest.fn()
const mockUseDownloadSubmission = jest.fn()
const mockUseFetchSubmissions = jest.fn()
const mockFetchMembersByUserIds = jest.fn()

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
    }): JSX.Element => (
        <button
            disabled={props.disabled}
            onClick={props.onClick}
            type='button'
        >
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})

jest.mock('../../../../../lib/assets/icons/lock.svg', () => ({
    ReactComponent: (): JSX.Element => <svg data-testid='lock-icon' />,
}))

jest.mock('../../../../../lib/components', () => ({
    ArtifactsModal: (): JSX.Element => <div>Artifacts modal</div>,
    Pagination: (props: { total: number }): JSX.Element => (
        <div data-testid='pagination-total'>{props.total}</div>
    ),
    SubmissionRunnerLogsModal: (): JSX.Element => <div>Runner logs modal</div>,
    SubmissionsTable: (props: { submissions: Submission[] }): JSX.Element => (
        <div data-testid='submissions-table'>
            {props.submissions.map(submission => (
                <div data-testid='submission-row' key={submission.id}>
                    <span>{submission.id}</span>
                    <span>{submission.memberHandle}</span>
                </div>
            ))}
        </div>
    ),
}))

jest.mock('../../../../../lib/constants', () => ({
    PAGE_SIZE: 10,
}))

jest.mock('../../../../../lib/contexts', () => {
    const React = require('react') as typeof import('react')

    return {
        WorkAppContext: React.createContext({
            isAdmin: false,
            isAnonymous: false,
            isCopilot: false,
            isManager: false,
            isReadOnly: false,
            loginUserInfo: undefined,
            userRoles: [],
        }),
    }
})

jest.mock('../../../../../lib/hooks', () => ({
    useDownloadAllSubmissions: (): unknown => mockUseDownloadAllSubmissions(),
    useDownloadSubmission: (): unknown => mockUseDownloadSubmission(),
    useFetchSubmissions: (...args: unknown[]): unknown => mockUseFetchSubmissions(...args),
}))

jest.mock('../../../../../lib/services', () => ({
    fetchMembersByUserIds: (...args: unknown[]): unknown => mockFetchMembersByUserIds(...args),
}))

jest.mock('../../../../../lib/utils', () => ({
    canDownloadSubmissions: (): boolean => false,
    canViewMarathonMatchRunnerLogs: (): boolean => false,
    getSubmissionFinalScore: (): number => 0,
    getSubmissionInitialScore: (): number => 0,
    getSubmissionProvisionalScore: (): number => 0,
    getSubmissionSystemScore: (): number => 0,
    isMarathonMatchChallenge: (): boolean => false,
    showErrorToast: jest.fn(),
}))

jest.mock('./SubmissionsSection.module.scss', () => new Proxy({}, {
    get: (_target, property) => String(property),
}))

const baseChallenge: Challenge = {
    id: 'challenge-1',
    name: 'Challenge',
    status: 'ACTIVE',
}

const submissions: Submission[] = [
    {
        challengeId: 'challenge-1',
        createdAt: '2026-07-01T10:00:00.000Z',
        createdBy: 'member-1',
        id: 'alpha-submission',
        memberHandle: 'alpha',
        type: 'SUBMISSION',
    },
    {
        challengeId: 'challenge-1',
        createdAt: '2026-07-01T11:00:00.000Z',
        createdBy: 'member-2',
        id: 'bravo-submission',
        memberHandle: 'bravo',
        type: 'SUBMISSION',
    },
    {
        challengeId: 'challenge-1',
        createdAt: '2026-07-01T12:00:00.000Z',
        createdBy: 'member-3',
        id: 'charlie-submission',
        legacySubmissionId: 'legacy-charlie-id',
        memberHandle: 'charlie',
        type: 'SUBMISSION',
    },
]

describe('SubmissionsSection', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockUseDownloadAllSubmissions.mockReturnValue({
            downloadAll: jest.fn(),
            isDownloading: false,
            progress: 0,
        })
        mockUseDownloadSubmission.mockReturnValue({
            downloadSubmission: jest.fn(),
            isLoading: {},
        })
        mockUseFetchSubmissions.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            submissions,
            total: submissions.length,
        })
        mockFetchMembersByUserIds.mockResolvedValue([])
    })

    it('filters submissions by current or legacy submission ID', () => {
        render(
            <SubmissionsSection
                challenge={baseChallenge}
                challengeId='challenge-1'
            />,
        )

        fireEvent.change(screen.getByLabelText('Submission ID'), {
            target: {
                value: 'BRAVO',
            },
        })

        expect(screen.getByText('bravo-submission'))
            .toBeTruthy()
        expect(screen.queryByText('alpha-submission'))
            .toBeNull()
        expect(screen.queryByText('charlie-submission'))
            .toBeNull()
        expect(screen.getByTestId('pagination-total').textContent)
            .toBe('1')

        fireEvent.change(screen.getByLabelText('Submission ID'), {
            target: {
                value: 'legacy-charlie',
            },
        })

        expect(screen.getByText('charlie-submission'))
            .toBeTruthy()
        expect(screen.queryByText('alpha-submission'))
            .toBeNull()
        expect(screen.queryByText('bravo-submission'))
            .toBeNull()
    })
})
