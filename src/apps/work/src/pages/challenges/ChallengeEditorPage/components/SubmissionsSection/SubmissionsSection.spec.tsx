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
const mockIsMarathonMatchChallenge = jest.fn()

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
    getSubmissionTestProgress: (
        submission: {
            reviewSummation?: Array<{
                metadata?: {
                    testProcess?: string
                    testType?: string
                }
            }>
        },
    ): { process?: string } => {
        const metadata = submission.reviewSummation?.[0]?.metadata

        return {
            process: metadata?.testProcess ?? metadata?.testType,
        }
    },
    isMarathonMatchChallenge: (...args: unknown[]): unknown => mockIsMarathonMatchChallenge(...args),
    showErrorToast: jest.fn(),
}))

jest.mock('./SubmissionsSection.module.scss', () => new Proxy({}, {
    get: (_target, property) => String(property),
}))

const baseChallenge: Challenge = {
    id: 'challenge-1',
    name: 'Marathon Match',
    status: 'ACTIVE',
}

const submissions: Submission[] = [
    {
        challengeId: 'challenge-1',
        createdAt: '2026-07-01T10:00:00.000Z',
        createdBy: 'member-1',
        id: 'system-submission',
        memberHandle: 'system-user',
        reviewSummation: [
            {
                metadata: {
                    testProcess: 'system',
                },
            },
        ],
        type: 'SUBMISSION',
    },
    {
        challengeId: 'challenge-1',
        createdAt: '2026-07-01T11:00:00.000Z',
        createdBy: 'member-2',
        id: 'provisional-submission',
        memberHandle: 'provisional-user',
        reviewSummation: [
            {
                metadata: {
                    testProcess: 'provisional',
                },
            },
        ],
        type: 'SUBMISSION',
    },
    {
        challengeId: 'challenge-1',
        createdAt: '2026-07-01T12:00:00.000Z',
        createdBy: 'member-3',
        id: 'example-submission',
        memberHandle: 'example-user',
        reviewSummation: [
            {
                metadata: {
                    testType: 'example',
                },
            },
        ],
        type: 'SUBMISSION',
    },
]

describe('SubmissionsSection', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockIsMarathonMatchChallenge.mockReturnValue(true)
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

    it('filters marathon submissions by test type', () => {
        render(
            <SubmissionsSection
                challenge={baseChallenge}
                challengeId='challenge-1'
            />,
        )

        fireEvent.change(screen.getByLabelText('Test type'), {
            target: {
                value: 'system',
            },
        })

        expect(screen.getByText('system-submission'))
            .toBeTruthy()
        expect(screen.queryByText('provisional-submission'))
            .toBeNull()
        expect(screen.queryByText('example-submission'))
            .toBeNull()
        expect(screen.getByTestId('pagination-total').textContent)
            .toBe('1')

        fireEvent.change(screen.getByLabelText('Test type'), {
            target: {
                value: 'example',
            },
        })

        expect(screen.getByText('example-submission'))
            .toBeTruthy()
        expect(screen.queryByText('system-submission'))
            .toBeNull()
        expect(screen.queryByText('provisional-submission'))
            .toBeNull()
    })
})
