/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    act,
    fireEvent,
    render,
    RenderResult,
    screen,
    waitFor,
} from '@testing-library/react'

import { ChallengeOpportunity, ChallengeSubmission } from '../models'
import { createChallengeSubmission } from '../services'

import {
    ChallengeSubmissionUpload,
    challengeSubmissionType,
    validateChallengeSubmissionFile,
} from './ChallengeSubmissionUpload'

const mockRecordAnalyticsEvent = jest.fn()

jest.mock('~/libs/core', () => ({
    recordAnalyticsEvent: (...args: unknown[]) => mockRecordAnalyticsEvent(...args),
}), { virtual: true })
jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        IconOutline: new Proxy({}, {
            get: () => Icon,
        }),
    }
}, { virtual: true })
jest.mock('react-toastify', () => ({
    toast: { error: jest.fn(), success: jest.fn() },
}))
jest.mock('../services', () => ({
    createChallengeSubmission: jest.fn(),
}))

const mockedCreateSubmission = createChallengeSubmission as jest.MockedFunction<typeof createChallengeSubmission>

/** Creates the minimum challenge data needed by the upload workflow. */
function challengeFixture(overrides: Partial<ChallengeOpportunity> = {}): ChallengeOpportunity {
    return {
        currentPhaseNames: ['Checkpoint Submission'],
        id: 'challenge-id',
        name: 'Submission challenge',
        phases: [{ isOpen: true, name: 'Checkpoint Submission' }],
        status: 'ACTIVE',
        track: { name: 'Design' },
        type: { name: 'Challenge' },
        ...overrides,
    }
}

/** Renders the upload workflow with stable no-op callbacks and optional prop overrides. */
function renderUpload(challenge: ChallengeOpportunity = challengeFixture()): RenderResult {
    return render(
        <ChallengeSubmissionUpload
            challenge={challenge}
            memberId='123'
            onBack={jest.fn()}
            onContactSupport={jest.fn()}
            onShowRequirements={jest.fn()}
            onShowTerms={jest.fn()}
            onSubmitted={jest.fn()}
        />,
    )
}

describe('ChallengeSubmissionUpload', () => {
    beforeEach(() => jest.clearAllMocks())

    it('renders Design required files and the singular upload label', () => {
        renderUpload()

        expect(screen.getByText('Source folder zip file'))
            .toBeInTheDocument()
        expect(screen.getByText('Submission folder zip file'))
            .toBeInTheDocument()
        expect(screen.getByText('Declarations txt file'))
            .toBeInTheDocument()
        expect(screen.getByText('Preview jpg image'))
            .toBeInTheDocument()
        expect(screen.getByLabelText(/Upload File\*/))
            .toBeInTheDocument()
    })

    it('renders the QA plural label and Requirements guidance', () => {
        renderUpload(challengeFixture({
            track: { name: 'Quality Assurance' },
        }))

        expect(screen.getByLabelText(/Upload File\(s\)\*/))
            .toBeInTheDocument()
        expect(screen.getByText(/Please follow the instructions on the Requirements tab/))
            .toBeInTheDocument()
        expect(screen.queryByText('Source folder zip file'))
            .not.toBeInTheDocument()
    })

    it('rejects a non-ZIP and an archive over 500MB', () => {
        expect(validateChallengeSubmissionFile(new File(['source'], 'submission.txt')))
            .toBe('Choose a ZIP file ending in .zip.')
        const oversized = new File(['source'], 'submission.zip')
        Object.defineProperty(oversized, 'size', { value: (500 * 1024 * 1024) + 1 })
        expect(validateChallengeSubmissionFile(oversized))
            .toBe('The ZIP file must be 500MB or smaller.')
    })

    it('derives final-fix, checkpoint, and contest Review API types', () => {
        expect(challengeSubmissionType(challengeFixture({
            currentPhaseNames: ['Final Fix'],
            phases: [{ isOpen: true, name: 'Final Fix' }],
        })))
            .toBe('STUDIO_FINAL_FIX_SUBMISSION')
        expect(challengeSubmissionType(challengeFixture()))
            .toBe('CHECKPOINT_SUBMISSION')
        expect(challengeSubmissionType(challengeFixture({
            currentPhaseNames: ['Submission'],
            phases: [{ isOpen: true, name: 'Submission' }],
        })))
            .toBe('CONTEST_SUBMISSION')
    })

    it('uploads with live progress and renders the exact success state', async () => {
        let resolveUpload: ((value: ChallengeSubmission) => void) | undefined
        mockedCreateSubmission.mockImplementation((...args) => {
            args[4]?.(25)
            return new Promise(resolve => {
                resolveUpload = resolve
            })
        })
        renderUpload()
        const file = new File(['zip'], 'MySubmission.zip', { type: 'application/zip' })

        fireEvent.change(screen.getByLabelText(/Upload File\*/), {
            target: { files: [file] },
        })
        fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and agree' }))
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

        expect(await screen.findByText('25%'))
            .toBeInTheDocument()
        expect(mockedCreateSubmission)
            .toHaveBeenCalledWith(
                'challenge-id',
                '123',
                'CHECKPOINT_SUBMISSION',
                file,
                expect.any(Function),
                expect.any(AbortSignal),
            )

        await act(async () => resolveUpload?.({ id: '123 456 789' }))
        await waitFor(() => expect(screen.getByText('Your solutions has been submitted'))
            .toBeInTheDocument())
        expect(screen.getByText('123 456 789'))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Back to submissions' }))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Submit another solution' }))
            .toBeInTheDocument()
        expect(mockRecordAnalyticsEvent)
            .toHaveBeenCalledWith('challenge_submitted', {
                challenge_id: 'challenge-id',
                challenge_track: 'design',
                member_id: '123',
                submission_type: 'CHECKPOINT_SUBMISSION',
            }, true)
    })
})
