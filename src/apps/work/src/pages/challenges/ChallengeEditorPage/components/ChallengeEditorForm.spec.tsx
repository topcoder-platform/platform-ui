/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import {
    useAutosave,
    useFetchChallengeTracks,
    useFetchChallengeTypes,
    useFetchProjectBillingAccount,
    useFetchResourceRoles,
    useFetchResources,
    useFetchTimelineTemplates,
} from '../../../../lib/hooks'
import type {
    Challenge,
    ChallengeEditorFormData,
} from '../../../../lib/models'
import {
    createResource,
    createChallenge,
    fetchChallenge,
    fetchProjectBillingAccount,
    fetchResourceRoles,
    fetchResources,
} from '../../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../../lib/utils'

import {
    ChallengeEditorForm,
    getTaskLaunchValidationError,
} from './ChallengeEditorForm'

jest.mock('../../../../lib/components/form', () => ({
    FormCheckboxField: () => <></>,
}))
jest.mock('../../../../lib/hooks', () => ({
    useAutosave: jest.fn(),
    useFetchChallengeTracks: jest.fn(),
    useFetchChallengeTypes: jest.fn(),
    useFetchProjectBillingAccount: jest.fn(),
    useFetchResourceRoles: jest.fn(),
    useFetchResources: jest.fn(),
    useFetchTimelineTemplates: jest.fn(),
}))
jest.mock('../../../../lib/services', () => ({
    createChallenge: jest.fn(),
    createResource: jest.fn(),
    deleteResource: jest.fn(),
    fetchChallenge: jest.fn(),
    fetchProjectBillingAccount: jest.fn(),
    fetchResourceRoles: jest.fn(),
    fetchResources: jest.fn(),
    patchChallenge: jest.fn(),
}))
jest.mock('../../../../lib/utils', () => ({
    formatLastSaved: () => '',
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
    transformChallengeToFormData: (challenge?: {
        name?: string
        status?: string
        trackId?: string
        typeId?: string
    }) => ({
        assignedMemberId: undefined,
        attachments: [],
        copilot: undefined,
        description: '',
        discussionForum: undefined,
        funChallenge: false,
        groups: [],
        id: challenge?.status,
        legacy: {
            isTask: false,
            reviewType: 'INTERNAL',
            useSchedulingAPI: false,
        },
        metadata: [],
        milestoneConfiguration: {
            enabled: false,
            milestoneCount: undefined,
            milestoneDurationDays: undefined,
        },
        name: challenge?.name || '',
        phases: [],
        privateDescription: '',
        prizeSets: [],
        reviewer: undefined,
        reviewers: [],
        roundType: 'Single round',
        skills: [],
        startDate: undefined,
        status: challenge?.status,
        tags: [],
        terms: [],
        trackId: challenge?.trackId || '',
        typeId: challenge?.typeId || '',
        wiproAllowed: false,
        workType: undefined,
    }),
    transformFormDataToChallenge: (formData: unknown) => formData,
}))
jest.mock('~/libs/ui', () => ({
    Button: (props: {
        className?: string
        disabled?: boolean
        label: string
        onClick?: () => void
        primary?: boolean
        secondary?: boolean
        size?: string
        type?: 'button' | 'submit'
    }) => (
        <button
            className={props.className}
            data-primary={props.primary
                ? 'true'
                : 'false'}
            data-secondary={props.secondary
                ? 'true'
                : 'false'}
            data-size={props.size}
            disabled={props.disabled}
            onClick={props.onClick}
            type={props.type === 'submit'
                ? 'submit'
                : 'button'}
        >
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})
jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ADMIN: {
            DIRECT_URL: 'https://example.com/direct',
            REVIEW_UI_URL: 'https://example.com/review',
        },
        API: {
            V5: 'https://example.com/v5',
            V6: 'https://example.com/v6',
        },
        CHALLENGE_API_URL: 'https://example.com/challenges',
        CHALLENGE_API_VERSION: 'v5',
        COMMUNITY_APP_URL: 'https://example.com/community',
        COPILOTS_URL: 'https://example.com/copilots',
        DIRECT_PROJECT_URL: 'https://example.com/direct-project',
        ENGAGEMENTS_URL: 'https://example.com/engagements',
        REVIEW_APP_URL: 'https://example.com/review',
        TC_DOMAIN: 'example.com',
        TC_FINANCE_API: 'https://example.com/finance',
        TOPCODER_URL: 'https://example.com/topcoder',
    },
}), {
    virtual: true,
})
jest.mock('./AssignedMemberField', () => ({
    AssignedMemberField: () => <></>,
}))
jest.mock('./AttachmentsField', () => ({
    AttachmentsField: () => <></>,
}))
jest.mock('./ChallengeDescriptionField', () => ({
    ChallengeDescriptionField: () => <></>,
}))
jest.mock('./ChallengeScheduleSection', () => ({
    ChallengeScheduleSection: () => <></>,
}))
jest.mock('./ChallengeFeeField', () => ({
    ChallengeFeeField: () => <></>,
}))
jest.mock('./ChallengeNameField', () => {
    const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')

    return {
        ChallengeNameField: function ChallengeNameField() {
            const controller = reactHookForm.useController({
                control: reactHookForm.useFormContext().control,
                name: 'name',
            })

            return (
                <label htmlFor='name'>
                    Challenge Name
                    <input
                        id='name'
                        onBlur={controller.field.onBlur}
                        onChange={controller.field.onChange}
                        value={controller.field.value || ''}
                    />
                </label>
            )
        },
    }
})
jest.mock('./ChallengePrivateDescriptionField', () => ({
    ChallengePrivateDescriptionField: () => <></>,
}))
jest.mock('./ChallengePrizesField', () => ({
    ChallengePrizesField: () => <></>,
}))
jest.mock('./ChallengeSkillsField', () => ({
    ChallengeSkillsField: () => <></>,
}))
jest.mock('./ChallengeTagsField', () => ({
    ChallengeTagsField: () => <></>,
}))
jest.mock('./ChallengeTotalField', () => ({
    ChallengeTotalField: () => <></>,
}))
jest.mock('./ChallengeTrackField', () => ({
    ChallengeTrackField: function ChallengeTrackField() {
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const controller = reactHookForm.useController({
            control: reactHookForm.useFormContext().control,
            name: 'trackId',
        })

        return (
            <label htmlFor='trackId'>
                Challenge Track
                <input
                    id='trackId'
                    onBlur={controller.field.onBlur}
                    onChange={controller.field.onChange}
                    value={controller.field.value || ''}
                />
            </label>
        )
    },
}))
jest.mock('./ChallengeTypeField', () => ({
    ChallengeTypeField: function ChallengeTypeField() {
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const controller = reactHookForm.useController({
            control: reactHookForm.useFormContext().control,
            name: 'typeId',
        })

        return (
            <label htmlFor='typeId'>
                Challenge Type
                <input
                    id='typeId'
                    onBlur={controller.field.onBlur}
                    onChange={controller.field.onChange}
                    value={controller.field.value || ''}
                />
            </label>
        )
    },
}))
jest.mock('./CheckpointPrizesField', () => ({
    CheckpointPrizesField: () => <></>,
}))
jest.mock('./CopilotField', () => ({
    CopilotField: function CopilotField() {
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const {
            control,
            setValue,
        }: Pick<
            import('react-hook-form').UseFormReturn<ChallengeEditorFormData>,
            'control' | 'setValue'
        > = reactHookForm.useFormContext<ChallengeEditorFormData>()
        const controller = reactHookForm.useController({
            control,
            name: 'copilot',
        })
        function handleAssignYourself(): void {
            setValue('copilot', 'self-copilot', {
                shouldDirty: true,
                shouldValidate: true,
            })
        }

        return (
            <div>
                <label htmlFor='copilot'>
                    Copilot Field
                    <input
                        id='copilot'
                        onBlur={controller.field.onBlur}
                        onChange={controller.field.onChange}
                        value={controller.field.value || ''}
                    />
                </label>
                <button
                    onClick={handleAssignYourself}
                    type='button'
                >
                    Assign yourself
                </button>
            </div>
        )
    },
}))
jest.mock('./CopilotFeeField', () => ({
    CopilotFeeField: () => <></>,
}))
jest.mock('./DesignWorkTypeField', () => ({
    DesignWorkTypeField: () => <></>,
}))
jest.mock('./FinalDeliverablesField', () => ({
    FinalDeliverablesField: () => <>Final Deliverables Field</>,
}))
jest.mock('./FunChallengeField', () => ({
    FunChallengeField: () => <></>,
}))
jest.mock('./GroupsField', () => ({
    GroupsField: () => <></>,
}))
jest.mock('./MaximumSubmissionsField', () => ({
    MaximumSubmissionsField: () => <>Maximum Submissions Field</>,
}))
jest.mock('./MarathonMatchScorerSection', () => ({
    MarathonMatchScorerSection: () => <></>,
}))
jest.mock('./NDAField', () => ({
    NDAField: () => <></>,
}))
jest.mock('./ReviewCostField', () => ({
    ReviewCostField: () => <></>,
}))
jest.mock('./ReviewersField', () => ({
    ReviewersField: () => <></>,
}))
jest.mock('./ReviewTypeField', () => ({
    ReviewTypeField: () => <></>,
}))
jest.mock('./RoundTypeField', () => ({
    RoundTypeField: () => <></>,
}))
jest.mock('./StockArtsField', () => ({
    StockArtsField: () => <>Stock Arts Field</>,
}))
jest.mock('./SubmissionVisibilityField', () => ({
    SubmissionVisibilityField: () => <>Submission Visibility Field</>,
}))
jest.mock('./TermsField', () => ({
    TermsField: () => <></>,
}))

const mockedUseAutosave = useAutosave as jest.Mock
const mockedUseFetchChallengeTracks = useFetchChallengeTracks as jest.Mock
const mockedUseFetchChallengeTypes = useFetchChallengeTypes as jest.Mock
const mockedUseFetchProjectBillingAccount = useFetchProjectBillingAccount as jest.Mock
const mockedUseFetchResourceRoles = useFetchResourceRoles as jest.Mock
const mockedUseFetchResources = useFetchResources as jest.Mock
const mockedUseFetchTimelineTemplates = useFetchTimelineTemplates as jest.Mock
const mockedCreateResource = createResource as jest.Mock
const mockedCreateChallenge = createChallenge as jest.Mock
const mockedFetchChallenge = fetchChallenge as jest.Mock
const mockedFetchProjectBillingAccountService = fetchProjectBillingAccount as jest.Mock
const mockedFetchResourceRolesService = fetchResourceRoles as jest.Mock
const mockedFetchResourcesService = fetchResources as jest.Mock
const mockedShowErrorToast = showErrorToast as jest.Mock
const mockedShowSuccessToast = showSuccessToast as jest.Mock

describe('ChallengeEditorForm', () => {
    const draftChallenge = {
        id: '12345',
        name: 'Draft challenge',
        status: 'DRAFT',
    } as Challenge

    beforeEach(() => {
        mockedUseAutosave.mockReturnValue({
            lastSaved: undefined,
            saveStatus: 'idle',
        })
        mockedUseFetchChallengeTracks.mockReturnValue({
            isLoading: false,
            tracks: [],
        })
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [],
            isLoading: false,
        })
        mockedUseFetchProjectBillingAccount.mockReturnValue({
            billingAccount: undefined,
            isLoading: false,
        })
        mockedUseFetchResourceRoles.mockImplementation(() => ({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [],
        }))
        mockedUseFetchResources.mockImplementation(() => ({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [],
        }))
        mockedUseFetchTimelineTemplates.mockReturnValue({
            timelineTemplates: [],
        })
        mockedFetchProjectBillingAccountService.mockResolvedValue({
            billingAccount: undefined,
        })
        mockedFetchResourceRolesService.mockResolvedValue([])
        mockedFetchResourcesService.mockResolvedValue([])
        mockedCreateResource.mockResolvedValue(undefined)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('preserves the challenge name while the create form rerenders', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <ChallengeEditorForm />
            </MemoryRouter>,
        )

        const challengeNameInput = screen.getByLabelText('Challenge Name') as HTMLInputElement

        await user.type(challengeNameInput, 'Create challenge regression')

        expect(challengeNameInput.value)
            .toBe('Create challenge regression')
    })

    it('renders the copilot field inside basic information for new challenges', () => {
        render(
            <MemoryRouter>
                <ChallengeEditorForm />
            </MemoryRouter>,
        )

        const basicInformationSection = screen.getByRole('heading', { name: 'Basic Information' })
            .closest('section')

        expect(
            within(basicInformationSection as HTMLElement)
                .getByText('Copilot Field'),
        )
            .toBeTruthy()
    })

    it('renders the copilot field inside basic information for existing challenges', () => {
        render(
            <MemoryRouter>
                <ChallengeEditorForm challenge={draftChallenge} />
            </MemoryRouter>,
        )

        const basicInformationSection = screen.getByRole('heading', { name: 'Basic Information' })
            .closest('section')
        const advancedOptionsSection = screen.getByRole('heading', { name: 'Advanced Options' })
            .closest('section')

        expect(
            within(basicInformationSection as HTMLElement)
                .getByText('Copilot Field'),
        )
            .toBeTruthy()
        expect(
            within(advancedOptionsSection as HTMLElement)
                .queryByText('Copilot Field'),
        )
            .toBeNull()
    })

    it('renders the billing account id inside advanced options when project billing is available', () => {
        mockedUseFetchProjectBillingAccount.mockReturnValue({
            billingAccount: {
                id: '80001063',
            },
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm challenge={draftChallenge} />
            </MemoryRouter>,
        )

        const advancedOptionsSection = screen.getByRole('heading', { name: 'Advanced Options' })
            .closest('section')

        expect(advancedOptionsSection)
            .toHaveTextContent('Billing Account Id')
        expect(advancedOptionsSection)
            .toHaveTextContent('80001063')
    })

    it('renders secondary footer actions and a primary launch action for draft challenges', () => {
        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    canLaunchChallenge
                    challenge={draftChallenge}
                    launchButtonLabel='Launch'
                    onLaunchOpen={jest.fn()}
                />
            </MemoryRouter>,
        )

        expect(
            screen.getByRole('button', { name: 'Cancel' })
                .getAttribute('data-secondary'),
        )
            .toBe('true')
        expect(
            screen.getByRole('button', { name: 'Cancel' })
                .getAttribute('data-size'),
        )
            .toBe('lg')
        expect(
            screen.getByRole('button', { name: 'Save Challenge' })
                .getAttribute('data-secondary'),
        )
            .toBe('true')
        expect(
            screen.getByRole('button', { name: 'Save Challenge' })
                .getAttribute('data-size'),
        )
            .toBe('lg')
        expect(
            screen.getByRole('button', { name: 'Launch' })
                .getAttribute('data-primary'),
        )
            .toBe('true')
        expect(
            screen.getByRole('button', { name: 'Launch' })
                .getAttribute('data-size'),
        )
            .toBe('lg')
    })

    it('renders existing challenges as read-only in view mode', () => {
        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={draftChallenge}
                    isReadOnly
                />
            </MemoryRouter>,
        )

        expect((document.querySelector('fieldset') as HTMLFieldSetElement).disabled)
            .toBe(true)
        expect(screen.queryByRole('button', { name: 'Cancel' }))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'Save Challenge' }))
            .toBeNull()
        expect(mockedUseAutosave)
            .toHaveBeenCalledWith(expect.objectContaining({
                enabled: false,
            }))
    })

    it('requires an assigned member before launching a task challenge', () => {
        expect(getTaskLaunchValidationError({
            currentStatus: 'DRAFT',
            isTaskChallenge: true,
            nextStatus: 'ACTIVE',
        }))
            .toBe('Assign a member before launching a task challenge.')
    })

    it('allows task launches when an assignee exists', () => {
        expect(getTaskLaunchValidationError({
            assignedMemberId: '12345',
            currentStatus: 'DRAFT',
            isTaskChallenge: true,
            nextStatus: 'ACTIVE',
        }))
            .toBeUndefined()
    })

    it('renders submission settings for design first2finish challenges', () => {
        mockedUseFetchChallengeTracks.mockReturnValue({
            isLoading: false,
            tracks: [{
                id: 'design-track',
                name: 'Design',
                track: 'DESIGN',
            }],
        })
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [{
                abbreviation: 'F2F',
                id: 'design-first2finish',
                name: 'First2Finish',
            }],
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...draftChallenge,
                        trackId: 'design-track',
                        type: {
                            abbreviation: 'F2F',
                            name: 'First2Finish',
                        },
                        typeId: 'design-first2finish',
                    }}
                />
            </MemoryRouter>,
        )

        const submissionSettingsSection = screen.getByRole('heading', { name: 'Submission Settings' })
            .closest('section')

        expect(submissionSettingsSection)
            .toHaveTextContent('Final Deliverables Field')
        expect(submissionSettingsSection)
            .toHaveTextContent('Submission Visibility Field')
        expect(submissionSettingsSection)
            .toHaveTextContent('Stock Arts Field')
        expect(submissionSettingsSection)
            .toHaveTextContent('Maximum Submissions Field')
    })

    it('creates a forum discussion for forum-enabled challenge types', async () => {
        const user = userEvent.setup()

        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [{
                abbreviation: 'CH',
                id: '927abff4-7af9-4145-8ba1-577c16e64e2e',
                isTask: false,
                name: 'Challenge',
            }],
            isLoading: false,
        })
        mockedCreateChallenge.mockResolvedValue({
            id: 'created-challenge-id',
            name: 'Forum Enabled Challenge',
            status: 'NEW',
        })
        mockedFetchChallenge.mockResolvedValue({
            id: 'created-challenge-id',
            name: 'Forum Enabled Challenge',
            status: 'NEW',
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm projectId='12345' />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Challenge Name'), 'Forum Enabled Challenge')
        await user.type(screen.getByLabelText('Challenge Track'), 'track-id')
        await user.type(screen.getByLabelText('Challenge Type'), '927abff4-7af9-4145-8ba1-577c16e64e2e')
        await user.click(screen.getByRole('button', { name: 'New' }))

        await waitFor(() => {
            expect(mockedCreateChallenge)
                .toHaveBeenCalledWith(expect.objectContaining({
                    discussions: [{
                        name: 'Forum Enabled Challenge Discussion',
                        provider: 'vanilla',
                        type: 'CHALLENGE',
                    }],
                    name: 'Forum Enabled Challenge',
                    projectId: '12345',
                    status: 'NEW',
                    trackId: 'track-id',
                    typeId: '927abff4-7af9-4145-8ba1-577c16e64e2e',
                }))
        })
    })

    it('persists an assigned-yourself copilot during initial draft creation', async () => {
        const user = userEvent.setup()

        mockedCreateChallenge.mockResolvedValue({
            id: 'created-challenge-id',
            name: 'Copilot Draft Challenge',
            status: 'NEW',
        })
        mockedFetchChallenge.mockResolvedValue({
            id: 'created-challenge-id',
            name: 'Copilot Draft Challenge',
            status: 'NEW',
        })
        mockedFetchResourceRolesService.mockResolvedValue([{
            id: 'copilot-role-id',
            name: 'Copilot',
        }])
        mockedFetchResourcesService.mockResolvedValue([])
        mockedCreateResource.mockResolvedValue({
            challengeId: 'created-challenge-id',
            memberHandle: 'self-copilot',
            roleId: 'copilot-role-id',
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm projectId='12345' />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Challenge Name'), 'Copilot Draft Challenge')
        await user.type(screen.getByLabelText('Challenge Track'), 'track-id')
        await user.type(screen.getByLabelText('Challenge Type'), 'type-id')
        await user.click(screen.getByRole('button', { name: 'Assign yourself' }))

        expect(screen.getByLabelText('Copilot Field'))
            .toHaveValue('self-copilot')

        await user.click(screen.getByRole('button', { name: 'New' }))

        await waitFor(() => {
            expect(mockedCreateResource)
                .toHaveBeenCalledWith({
                    challengeId: 'created-challenge-id',
                    memberHandle: 'self-copilot',
                    roleId: 'copilot-role-id',
                })
        })
        await waitFor(() => {
            expect(screen.getByLabelText('Copilot Field'))
                .toHaveValue('self-copilot')
        })
    })

    it('keeps the created draft when the initial copilot sync fails', async () => {
        const user = userEvent.setup()

        mockedCreateChallenge.mockResolvedValue({
            id: 'created-challenge-id',
            name: 'Copilot Draft Challenge',
            status: 'NEW',
        })
        mockedFetchChallenge.mockResolvedValue({
            id: 'created-challenge-id',
            name: 'Copilot Draft Challenge',
            status: 'NEW',
        })
        mockedFetchResourceRolesService.mockResolvedValue([{
            id: 'copilot-role-id',
            name: 'Copilot',
        }])
        mockedFetchResourcesService.mockResolvedValue([])
        mockedCreateResource.mockRejectedValue(new Error('resource sync failed'))

        render(
            <MemoryRouter>
                <ChallengeEditorForm projectId='12345' />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Challenge Name'), 'Copilot Draft Challenge')
        await user.type(screen.getByLabelText('Challenge Track'), 'track-id')
        await user.type(screen.getByLabelText('Challenge Type'), 'type-id')
        await user.click(screen.getByRole('button', { name: 'Assign yourself' }))
        await user.click(screen.getByRole('button', { name: 'New' }))

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Save as Draft' }))
                .toBeInTheDocument()
        })
        expect(screen.queryByRole('button', { name: 'New' }))
            .toBeNull()
        expect(screen.getByLabelText('Copilot Field'))
            .toHaveValue('')
        expect(mockedShowSuccessToast)
            .toHaveBeenCalledWith('Challenge created successfully')
        expect(mockedShowErrorToast)
            .toHaveBeenCalledWith(
                'Challenge created, but the selected copilot could not be saved. Please add it again.',
            )
    })
})
