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
import {
    createChallengeSubmission,
    createChallengeUrlSubmission,
} from '../services'

import {
    ChallengeSubmissionUpload,
    challengeSubmissionType,
    validateChallengeSubmissionFile,
    validateChallengeSubmissionUrl,
} from './ChallengeSubmissionUpload'

const mockRecordAnalyticsEvent = jest.fn()

jest.mock('~/config', () => ({
    EnvironmentConfig: { URLS: { TERMS_OF_USE: 'https://www.example.com/terms' } },
}), { virtual: true })
jest.mock('~/libs/cms', () => ({
    getSafeCmsLink: jest.fn(),
}), { virtual: true })
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
    createChallengeUrlSubmission: jest.fn(),
}))

const mockedCreateSubmission = createChallengeSubmission as jest.MockedFunction<typeof createChallengeSubmission>
const mockedCreateUrlSubmission
    = createChallengeUrlSubmission as jest.MockedFunction<typeof createChallengeUrlSubmission>

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

/**
 * Renders the upload workflow with stable callbacks.
 *
 * @param challenge challenge fixture rendered by the form.
 * @param onValidateRegistration pre-upload registration result.
 * @param onUploadingChange optional observer for the active upload state.
 * @returns Testing Library render result.
 * @throws Does not throw.
 */
function renderUpload(
    challenge?: ChallengeOpportunity,
    onValidateRegistration?: () => Promise<boolean>,
    onUploadingChange?: (uploading: boolean) => void,
): RenderResult {
    return render(
        <ChallengeSubmissionUpload
            challenge={challenge ?? challengeFixture()}
            memberId='123'
            onBack={jest.fn()}
            onContactSupport={jest.fn()}
            onShowRequirements={jest.fn()}
            onSubmitted={jest.fn()}
            onUploadingChange={onUploadingChange}
            onValidateRegistration={onValidateRegistration ?? (async () => true)}
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

    it('opens the site Terms of Use instead of challenge registration terms', () => {
        renderUpload()

        expect(screen.getByRole('link', { name: /Terms of Use/ }))
            .toHaveAttribute('href', 'https://www.example.com/terms')
        expect(screen.getByRole('link', { name: /Terms of Use/ }))
            .toHaveAttribute('target', '_blank')
    })

    it('rejects a non-ZIP and an archive over 500MB', () => {
        expect(validateChallengeSubmissionFile(new File(['source'], 'submission.txt')))
            .toBe('Choose a ZIP file ending in .zip.')
        const oversized = new File(['source'], 'submission.zip')
        Object.defineProperty(oversized, 'size', { value: (500 * 1024 * 1024) + 1 })
        expect(validateChallengeSubmissionFile(oversized))
            .toBe('The ZIP file must be 500MB or smaller.')
    })

    it('accepts only trimmed absolute HTTP or HTTPS submission URLs', () => {
        expect(validateChallengeSubmissionUrl(''))
            .toBe('Enter the URL to your submission.')
        expect(validateChallengeSubmissionUrl('deliverables.example.com/result'))
            .toBe('Enter a valid submission URL.')
        expect(validateChallengeSubmissionUrl('ftp://deliverables.example.com/result'))
            .toBe('Enter a URL beginning with http:// or https://.')
        expect(validateChallengeSubmissionUrl('  https://deliverables.example.com/result  '))
            .toBeUndefined()
    })

    it('renders metadata-selected URL guidance without the ZIP picker', () => {
        renderUpload(challengeFixture({
            metadata: [{ name: ' SUBMISSION_TYPE ', value: ' URL ' }],
        }))

        expect(screen.getByText('Submit the URL to your solution as described in the requirements.'))
            .toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Required Link' }))
            .toBeInTheDocument()
        expect(screen.getByLabelText(/Submission URL/))
            .toHaveAttribute('type', 'url')
        expect(screen.getByRole('button', { name: 'Set URL' }))
            .toBeInTheDocument()
        expect(screen.queryByLabelText(/Upload File/))
            .not.toBeInTheDocument()
        expect(screen.queryByText('Drop your file(s) here or'))
            .not.toBeInTheDocument()
        expect(screen.getByText('Link directly to your challenge deliverable'))
            .toBeInTheDocument()
    })

    it('validates and reconfirms an edited URL before enabling its declaration', () => {
        renderUpload(challengeFixture({
            metadata: [{ name: 'submission_type', value: 'url' }],
        }))
        const urlInput = screen.getByLabelText(/Submission URL/)
        const agreement = screen.getByRole('checkbox', { name: 'I understand and agree' })

        fireEvent.change(urlInput, { target: { value: 'ftp://files.example.com/result' } })
        fireEvent.click(screen.getByRole('button', { name: 'Set URL' }))
        expect(screen.getByRole('alert'))
            .toHaveTextContent('Enter a URL beginning with http:// or https://.')
        expect(urlInput)
            .toHaveAttribute('aria-invalid', 'true')
        expect(agreement)
            .toBeDisabled()

        fireEvent.change(urlInput, { target: { value: '  https://files.example.com/result  ' } })
        fireEvent.click(screen.getByRole('button', { name: 'Set URL' }))
        expect(screen.getByText('Ready to submit'))
            .toBeInTheDocument()
        expect(screen.getByText('https://files.example.com/result'))
            .toBeInTheDocument()
        expect(urlInput)
            .toHaveValue('https://files.example.com/result')
        expect(agreement)
            .not.toBeDisabled()

        fireEvent.click(agreement)
        fireEvent.change(urlInput, { target: { value: 'https://files.example.com/revised' } })
        expect(screen.queryByText('Ready to submit'))
            .not.toBeInTheDocument()
        expect(agreement)
            .toBeDisabled()
        expect(agreement)
            .not.toBeChecked()
    })

    it('posts a confirmed URL directly and resets URL state for another solution', async () => {
        mockedCreateUrlSubmission.mockResolvedValue({ id: 'url-submission-id' })
        renderUpload(challengeFixture({
            currentPhaseNames: ['Submission'],
            metadata: [{ name: 'submission_type', value: 'url' }],
            phases: [{ isOpen: true, name: 'Submission' }],
        }))

        fireEvent.change(screen.getByLabelText(/Submission URL/), {
            target: { value: '  https://files.example.com/result  ' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Set URL' }))
        fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and agree' }))
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(mockedCreateUrlSubmission)
            .toHaveBeenCalledWith(
                'challenge-id',
                '123',
                'CONTEST_SUBMISSION',
                'https://files.example.com/result',
                expect.any(AbortSignal),
            ))
        expect(mockedCreateSubmission)
            .not.toHaveBeenCalled()
        expect(await screen.findByText('url-submission-id'))
            .toBeInTheDocument()
        expect(mockRecordAnalyticsEvent)
            .toHaveBeenCalledWith('challenge_submitted', {
                challenge_id: 'challenge-id',
                challenge_track: 'design',
                member_id: '123',
                submission_type: 'CONTEST_SUBMISSION',
            }, true)

        fireEvent.click(screen.getByRole('button', { name: 'Submit another solution' }))
        expect(screen.getByLabelText(/Submission URL/))
            .toHaveValue('')
        expect(screen.getByRole('checkbox', { name: 'I understand and agree' }))
            .toBeDisabled()
    })

    it('revalidates registration before creating a URL submission', async () => {
        const validateRegistration = jest.fn()
            .mockResolvedValue(false)
        renderUpload(
            challengeFixture({ metadata: [{ name: 'submission_type', value: 'url' }] }),
            validateRegistration,
        )

        fireEvent.change(screen.getByLabelText(/Submission URL/), {
            target: { value: 'https://files.example.com/result' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Set URL' }))
        fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and agree' }))
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' }))
            .not.toBeDisabled())
        expect(validateRegistration)
            .toHaveBeenCalledTimes(1)
        expect(mockedCreateUrlSubmission)
            .not.toHaveBeenCalled()
    })

    it('cancels a pending URL submission and unlocks parent navigation', async () => {
        const onUploadingChange = jest.fn()
        mockedCreateUrlSubmission.mockImplementation((...args) => new Promise((_resolve, reject) => {
            args[4]?.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')))
        }))
        renderUpload(
            challengeFixture({ metadata: [{ name: 'submission_type', value: 'url' }] }),
            async () => true,
            onUploadingChange,
        )

        fireEvent.change(screen.getByLabelText(/Submission URL/), {
            target: { value: 'https://files.example.com/result' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Set URL' }))
        fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and agree' }))
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(onUploadingChange)
            .toHaveBeenLastCalledWith(true))
        expect(screen.getByRole('button', { name: 'Back to My Submissions' }))
            .toBeDisabled()
        fireEvent.click(screen.getByRole('button', { name: 'Cancel submission' }))
        await waitFor(() => expect(onUploadingChange)
            .toHaveBeenLastCalledWith(false))
        expect(screen.getByLabelText(/Submission URL/))
            .toHaveValue('')
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
        expect(screen.getByText('Ready to upload'))
            .toBeInTheDocument()
        expect(screen.queryByRole('progressbar'))
            .not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and agree' }))
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

        expect(await screen.findByText('25%'))
            .toBeInTheDocument()
        expect(screen.getByText('Uploading'))
            .toBeInTheDocument()
        expect(screen.getByRole('progressbar'))
            .toHaveAttribute('aria-valuenow', '25')
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

    it('does not upload when the submitter registration is no longer current', async () => {
        const validateRegistration = jest.fn()
            .mockResolvedValue(false)
        renderUpload(challengeFixture(), validateRegistration)
        const file = new File(['zip'], 'MySubmission.zip', { type: 'application/zip' })

        fireEvent.change(screen.getByLabelText(/Upload File\*/), {
            target: { files: [file] },
        })
        fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and agree' }))
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' }))
            .not.toBeDisabled())
        expect(validateRegistration)
            .toHaveBeenCalledTimes(1)
        expect(mockedCreateSubmission)
            .not.toHaveBeenCalled()
    })

    it('keeps cancellation effective while registration validation is pending', async () => {
        let resolveRegistration: ((value: boolean) => void) | undefined
        const validateRegistration = jest.fn(() => new Promise<boolean>(resolve => {
            resolveRegistration = resolve
        }))
        renderUpload(challengeFixture(), validateRegistration)
        const file = new File(['zip'], 'MySubmission.zip', { type: 'application/zip' })

        fireEvent.change(screen.getByLabelText(/Upload File\*/), {
            target: { files: [file] },
        })
        fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and agree' }))
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
        await waitFor(() => expect(validateRegistration)
            .toHaveBeenCalledTimes(1))
        fireEvent.click(screen.getByRole('button', { name: 'Cancel upload' }))
        await act(async () => resolveRegistration?.(true))

        expect(mockedCreateSubmission)
            .not.toHaveBeenCalled()
    })

    it('locks navigation while an upload is active and reports when it is safe again', async () => {
        const onUploadingChange = jest.fn()
        mockedCreateSubmission.mockImplementation(() => new Promise(() => {
            // Keep the upload pending until the member explicitly cancels it.
        }))
        renderUpload(challengeFixture(), async () => true, onUploadingChange)
        const file = new File(['zip'], 'MySubmission.zip', { type: 'application/zip' })

        fireEvent.change(screen.getByLabelText(/Upload File\*/), {
            target: { files: [file] },
        })
        fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and agree' }))
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(onUploadingChange)
            .toHaveBeenLastCalledWith(true))
        expect(screen.getByRole('button', { name: 'Back to My Submissions' }))
            .toBeDisabled()
        expect(screen.getByRole('button', { name: 'Learn more' }))
            .toBeDisabled()
        expect(screen.getByRole('button', { name: 'Cancel' }))
            .toBeDisabled()

        fireEvent.click(screen.getByRole('button', { name: 'Cancel upload' }))

        await waitFor(() => expect(onUploadingChange)
            .toHaveBeenLastCalledWith(false))
    })
})
