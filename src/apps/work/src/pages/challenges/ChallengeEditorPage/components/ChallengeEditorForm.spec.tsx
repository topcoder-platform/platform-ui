/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, complexity, react/jsx-no-bind */
import {
    act,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import {
    MemoryRouter,
    useLocation,
} from 'react-router-dom'

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
    deleteResource,
    fetchChallenge,
    fetchProjectBillingAccount,
    patchChallenge,
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
import { TermsField } from './TermsField'

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
    transformChallengeToFormData: (challenge?: Partial<Challenge>) => ({
        assignedMemberId: challenge?.assignedMemberId,
        attachments: Array.isArray(challenge?.attachments)
            ? challenge?.attachments
            : undefined,
        billing: challenge?.billing,
        challengeFee: challenge?.challengeFee,
        copilot: typeof challenge?.copilot === 'string'
            ? challenge.copilot
            : undefined,
        description: challenge?.description || '',
        discussionForum: challenge?.discussionForum,
        funChallenge: challenge?.funChallenge === true,
        groups: Array.isArray(challenge?.groups)
            ? challenge?.groups
            : [],
        id: challenge?.id,
        legacy: challenge?.legacy || {
            isTask: false,
            reviewType: 'INTERNAL',
            useSchedulingAPI: false,
        },
        metadata: Array.isArray(challenge?.metadata)
            ? challenge?.metadata
            : [],
        milestoneConfiguration: {
            enabled: false,
            milestoneCount: undefined,
            milestoneDurationDays: undefined,
        },
        name: challenge?.name || '',
        phases: Array.isArray(challenge?.phases)
            ? challenge?.phases
            : [],
        privateDescription: challenge?.privateDescription || '',
        prizeSets: Array.isArray(challenge?.prizeSets)
            ? challenge?.prizeSets
            : [],
        reviewer: typeof challenge?.reviewer === 'string'
            ? challenge.reviewer
            : undefined,
        reviewers: Array.isArray(challenge?.reviewers)
            ? challenge?.reviewers
            : [],
        roundType: challenge?.roundType || 'Single round',
        skills: Array.isArray(challenge?.skills)
            ? challenge?.skills
            : [],
        startDate: challenge?.startDate,
        status: challenge?.status,
        tags: Array.isArray(challenge?.tags)
            ? challenge?.tags
            : [],
        terms: Array.isArray(challenge?.terms)
            ? challenge?.terms as string[]
            : [],
        trackId: challenge?.trackId || '',
        typeId: challenge?.typeId || '',
        wiproAllowed: challenge?.wiproAllowed === true,
        workType: typeof challenge?.workType === 'string'
            ? challenge.workType
            : undefined,
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
    AssignedMemberField: () => <span>Assigned Member Field</span>,
}))
jest.mock('./AttachmentsField', () => {
    const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')

    return {
        AttachmentsField: function AttachmentsField() {
            const formContext = reactHookForm.useFormContext()
            const attachments = reactHookForm.useWatch({
                control: formContext.control,
                name: 'attachments',
            })
            const attachmentCount = Array.isArray(attachments)
                ? attachments.length
                : 0
            const handleAddAttachment = (): void => {
                formContext.setValue('attachments', [{
                    fileSize: 1024,
                    id: 'attachment-1',
                    name: 'spec.pdf',
                    url: 'https://example.com/spec.pdf',
                }], {
                    shouldDirty: true,
                    shouldValidate: true,
                })
            }

            return (
                <>
                    <div>{`Attachment Count: ${attachmentCount}`}</div>
                    <button
                        onClick={handleAddAttachment}
                        type='button'
                    >
                        Mock Add Attachment
                    </button>
                </>
            )
        },
    }
})
jest.mock('./ChallengeDescriptionField', () => ({
    ChallengeDescriptionField: () => <></>,
}))
jest.mock('./ChallengeScheduleSection', () => ({
    ChallengeScheduleSection: function ChallengeScheduleSection(props: {
        disabled?: boolean
    }) {
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const formContext = reactHookForm.useFormContext()
        const phases = reactHookForm.useWatch({
            control: formContext.control,
            name: 'phases',
        }) as Array<{
            scheduledEndDate?: string
        }> | undefined

        return (
            <div
                data-disabled={props.disabled === true ? 'true' : 'false'}
                data-first-phase-end={phases?.[0]?.scheduledEndDate || ''}
                data-testid='challenge-schedule-section'
            />
        )
    },
}))
jest.mock('./ChallengeFeeField', () => ({
    ChallengeFeeField: function ChallengeFeeField() {
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const billing = reactHookForm.useWatch({
            control: reactHookForm.useFormContext().control,
            name: 'billing',
        }) as {
            markup?: number
        } | undefined

        return <div data-testid='billing-markup'>{String(billing?.markup ?? '')}</div>
    },
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
    DesignWorkTypeField: function DesignWorkTypeField() {
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const controller = reactHookForm.useController({
            control: reactHookForm.useFormContext().control,
            name: 'workType',
        })

        return (
            <label htmlFor='workType'>
                Work Type
                <input
                    id='workType'
                    onBlur={controller.field.onBlur}
                    onChange={controller.field.onChange}
                    value={controller.field.value || ''}
                />
            </label>
        )
    },
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
    MaximumSubmissionsField: (props: {
        deferDirty?: boolean
    }) => (
        <div
            data-defer-dirty={props.deferDirty === true
                ? 'true'
                : 'false'}
            data-testid='maximum-submissions-field'
        >
            Maximum Submissions Field
        </div>
    ),
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
    ReviewersField: (props: { isReadOnly?: boolean }) => (
        <div
            data-read-only={props.isReadOnly === true ? 'true' : 'false'}
            data-testid='reviewers-field'
        >
            Reviewers Field
        </div>
    ),
}))
jest.mock('./ReviewTypeField', () => ({
    ReviewTypeField: () => <span>Review Type Field</span>,
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
    TermsField: jest.fn(() => <></>),
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
const mockedDeleteResource = deleteResource as jest.Mock
const mockedFetchChallenge = fetchChallenge as jest.Mock
const mockedFetchProjectBillingAccountService = fetchProjectBillingAccount as jest.Mock
const mockedPatchChallenge = patchChallenge as jest.Mock
const mockedFetchResourceRolesService = fetchResourceRoles as jest.Mock
const mockedFetchResourcesService = fetchResources as jest.Mock
const mockedShowErrorToast = showErrorToast as jest.Mock
const mockedShowSuccessToast = showSuccessToast as jest.Mock
const mockedTermsField = TermsField as jest.MockedFunction<typeof TermsField>

const LocationDisplay = (): JSX.Element => {
    const location = useLocation()

    return <div data-testid='location-display'>{location.pathname}</div>
}

describe('ChallengeEditorForm', () => {
    const draftChallenge = {
        id: '12345',
        name: 'Draft challenge',
        status: 'DRAFT',
    } as Challenge
    const validDraftChallenge = {
        ...draftChallenge,
        description: 'Valid public specification for the attachment save regression test.',
        prizeSets: [{
            prizes: [{
                type: 'USD',
                value: 500,
            }],
            type: 'PLACEMENT',
        }],
        skills: [{
            id: 'skill-1',
            name: 'React',
        }],
        trackId: 'track-id',
        typeId: 'type-id',
    } as Challenge
    const validNewChallenge = {
        ...validDraftChallenge,
        status: 'NEW',
    } as Challenge
    const taskDraftChallenge = {
        ...draftChallenge,
        task: {
            isTask: true,
        },
        type: {
            abbreviation: 'TSK',
            name: 'Task',
        },
        typeId: 'task-type-id',
    } as Challenge
    const first2FinishDraftChallenge = {
        ...validDraftChallenge,
        phases: [{
            duration: 60,
            name: 'Iterative Review',
            phaseId: 'iterative-review-phase-id',
        }],
        reviewers: [{
            isMemberReview: true,
            memberId: 'manual-reviewer-member-id',
            phaseId: 'iterative-review-phase-id',
            scorecardId: 'iterative-review-scorecard-id',
            shouldOpenOpportunity: false,
        }],
        trackId: 'design-track',
        type: {
            abbreviation: 'F2F',
            name: 'First2Finish',
        },
        typeId: 'design-first2finish',
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

    it('hides the editable timeline section for task challenges in edit mode', () => {
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [{
                abbreviation: 'TSK',
                id: 'task-type-id',
                isTask: true,
                name: 'Task',
            }],
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={taskDraftChallenge}
                    isEditMode
                />
            </MemoryRouter>,
        )

        expect(screen.queryByRole('heading', { name: 'Timeline & Schedule' }))
            .toBeNull()
    })

    it('hides the editable timeline section for task challenges in create mode', () => {
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [{
                abbreviation: 'TSK',
                id: 'task-type-id',
                isTask: true,
                name: 'Task',
            }],
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm challenge={taskDraftChallenge} />
            </MemoryRouter>,
        )

        expect(screen.queryByRole('heading', { name: 'Timeline & Schedule' }))
            .toBeNull()
    })

    it('hides the editable timeline section for task challenges in read-only view mode', () => {
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [{
                abbreviation: 'TSK',
                id: 'task-type-id',
                isTask: true,
                name: 'Task',
            }],
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={taskDraftChallenge}
                    isEditMode
                    isReadOnly
                />
            </MemoryRouter>,
        )

        expect(screen.queryByRole('heading', { name: 'Timeline & Schedule' }))
            .toBeNull()
    })

    it('keeps the task timeline hidden in edit mode when only the persisted task flag is available', () => {
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [],
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...draftChallenge,
                        task: {
                            isTask: true,
                        },
                        typeId: 'task-type-id',
                    }}
                    isEditMode
                />
            </MemoryRouter>,
        )

        expect(screen.queryByRole('heading', { name: 'Timeline & Schedule' }))
            .toBeNull()
    })

    it('keeps task-only controls visible in edit mode when only the persisted task flag is available', () => {
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [],
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...draftChallenge,
                        task: {
                            isTask: true,
                        },
                        typeId: 'task-type-id',
                    }}
                    isEditMode
                />
            </MemoryRouter>,
        )

        expect(screen.getByText('Assigned Member Field'))
            .toBeInTheDocument()
        expect(screen.getByText('Review Type Field'))
            .toBeInTheDocument()
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
        expect(screen.getByTestId('challenge-schedule-section'))
            .toHaveAttribute('data-disabled', 'true')
        expect(screen.getByTestId('challenge-schedule-section')
            .closest('fieldset[disabled]'))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'Cancel' }))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'Save Challenge' }))
            .toBeNull()
        expect(mockedUseAutosave)
            .toHaveBeenCalledWith(expect.objectContaining({
                enabled: false,
            }))
    })

    it('does not default the standard term when viewing an existing challenge', () => {
        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={draftChallenge}
                    isReadOnly
                />
            </MemoryRouter>,
        )

        expect(mockedTermsField)
            .toHaveBeenCalled()
        expect(mockedTermsField.mock.calls[mockedTermsField.mock.calls.length - 1][0])
            .toEqual(expect.objectContaining({
                shouldDefaultStandardTerm: false,
            }))
    })

    it('defaults the standard term for created challenges outside edit and view mode', () => {
        render(
            <MemoryRouter>
                <ChallengeEditorForm challenge={draftChallenge} />
            </MemoryRouter>,
        )

        expect(mockedTermsField)
            .toHaveBeenCalled()
        expect(mockedTermsField.mock.calls[mockedTermsField.mock.calls.length - 1][0])
            .toEqual(expect.objectContaining({
                shouldDefaultStandardTerm: true,
            }))
    })

    it('preserves project billing markup when fetched draft data resets the form', async () => {
        mockedUseFetchProjectBillingAccount.mockReturnValue({
            billingAccount: {
                id: '80001063',
                markup: 0.33,
            },
            isLoading: false,
        })

        const renderResult: ReturnType<typeof render> = render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...draftChallenge,
                        id: 'initial-draft-id',
                        projectId: '100578',
                    }}
                    projectId='100578'
                />
            </MemoryRouter>,
        )

        expect(screen.getByTestId('billing-markup'))
            .toHaveTextContent('0.33')

        renderResult.rerender(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...draftChallenge,
                        billing: {
                            billingAccountId: '80001063',
                            markup: 0,
                        },
                        projectId: '100578',
                    }}
                    projectId='100578'
                />
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(screen.getByTestId('billing-markup'))
                .toHaveTextContent('0.33')
        })
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

    it('rejects launch when task validation blocks activation', async () => {
        let launchAction: (() => Promise<void>) | undefined
        let launchError: Error | undefined

        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [{
                abbreviation: 'TSK',
                id: 'task-type-id',
                isTask: true,
                name: 'Task',
            }],
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...validDraftChallenge,
                        type: {
                            abbreviation: 'TSK',
                            name: 'Task',
                        },
                        typeId: 'task-type-id',
                    }}
                    onRegisterLaunchAction={action => {
                        launchAction = action
                    }}
                />
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(launchAction)
                .toEqual(expect.any(Function))
        })

        await act(async () => {
            try {
                await (launchAction as () => Promise<void>)()
            } catch (error) {
                launchError = error as Error
            }
        })

        expect(launchError)
            .toEqual(expect.objectContaining({
                message: 'Assign a member before launching a task challenge.',
            }))
        expect(mockedPatchChallenge)
            .not.toHaveBeenCalled()
        expect(mockedShowErrorToast)
            .toHaveBeenCalledWith('Assign a member before launching a task challenge.')
        expect(mockedShowErrorToast)
            .not.toHaveBeenCalledWith('Failed to save challenge')
    })

    it('registers the launch action for read-only draft challenges', async () => {
        let launchAction: (() => Promise<void>) | undefined

        mockedPatchChallenge.mockResolvedValue({
            ...validDraftChallenge,
            status: 'ACTIVE',
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={validDraftChallenge}
                    isReadOnly
                    onRegisterLaunchAction={action => {
                        launchAction = action
                    }}
                />
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(launchAction)
                .toEqual(expect.any(Function))
        })

        await act(async () => {
            await launchAction?.()
                .catch(() => undefined)
        })

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledWith('12345', expect.objectContaining({
                    status: 'ACTIVE',
                }))
        })
    })

    it('launches a read-only draft when manual reviewer assignments exist only in resources', async () => {
        let launchAction: (() => Promise<void>) | undefined

        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'reviewer-role-id',
                name: 'Reviewer',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [{
                challengeId: '12345',
                memberHandle: 'manual-reviewer',
                memberId: 'manual-reviewer-member-id',
                role: 'Reviewer',
                roleId: 'reviewer-role-id',
            }],
        })
        mockedFetchResourcesService.mockResolvedValue([{
            challengeId: '12345',
            memberHandle: 'manual-reviewer',
            memberId: 'manual-reviewer-member-id',
            role: 'Reviewer',
            roleId: 'reviewer-role-id',
        }])
        mockedPatchChallenge.mockResolvedValue({
            ...validDraftChallenge,
            phases: [{
                duration: 60,
                name: 'Review',
                phaseId: 'review-phase-id',
            }],
            reviewers: [{
                isMemberReview: true,
                memberId: 'manual-reviewer-member-id',
                memberReviewerCount: 1,
                phaseId: 'review-phase-id',
                scorecardId: 'review-scorecard-id',
                shouldOpenOpportunity: false,
            }],
            status: 'ACTIVE',
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...validDraftChallenge,
                        phases: [{
                            duration: 60,
                            name: 'Review',
                            phaseId: 'review-phase-id',
                        }],
                        reviewers: [{
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'review-phase-id',
                            scorecardId: 'review-scorecard-id',
                            shouldOpenOpportunity: false,
                        }],
                    }}
                    isReadOnly
                    onRegisterLaunchAction={action => {
                        launchAction = action
                    }}
                />
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(launchAction)
                .toEqual(expect.any(Function))
        })

        await act(async () => {
            await launchAction?.()
                .catch(() => undefined)
        })

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledWith('12345', expect.objectContaining({
                    reviewers: [
                        expect.objectContaining({
                            memberId: 'manual-reviewer-member-id',
                            shouldOpenOpportunity: false,
                        }),
                    ],
                    status: 'ACTIVE',
                }))
        })
        expect(mockedShowErrorToast)
            .not.toHaveBeenCalledWith('Please fix validation errors before launching')
    })

    it('launches a read-only draft when approval assignments are stored under the generic reviewer role', async () => {
        let launchAction: (() => Promise<void>) | undefined

        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'reviewer-role-id',
                name: 'Reviewer',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [{
                challengeId: '12345',
                memberId: 'approval-reviewer-member-id',
                role: 'Reviewer',
                roleId: 'reviewer-role-id',
            }],
        })
        mockedFetchResourcesService.mockResolvedValue([{
            challengeId: '12345',
            memberId: 'approval-reviewer-member-id',
            role: 'Reviewer',
            roleId: 'reviewer-role-id',
        }])
        mockedPatchChallenge.mockResolvedValue({
            ...validDraftChallenge,
            phases: [{
                duration: 24,
                name: 'Approval',
                phaseId: 'approval-phase-id',
            }],
            reviewers: [{
                isMemberReview: true,
                memberReviewerCount: 1,
                phaseId: 'approval-phase-id',
                scorecardId: 'approval-scorecard-id',
                shouldOpenOpportunity: false,
            }],
            status: 'ACTIVE',
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...validDraftChallenge,
                        phases: [{
                            duration: 24,
                            name: 'Approval',
                            phaseId: 'approval-phase-id',
                        }],
                        reviewers: [{
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'approval-phase-id',
                            scorecardId: 'approval-scorecard-id',
                            shouldOpenOpportunity: false,
                        }],
                    }}
                    isReadOnly
                    onRegisterLaunchAction={action => {
                        launchAction = action
                    }}
                />
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(launchAction)
                .toEqual(expect.any(Function))
        })

        await act(async () => {
            await launchAction?.()
                .catch(() => undefined)
        })

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledWith('12345', expect.objectContaining({
                    reviewers: [
                        expect.objectContaining({
                            memberId: 'approval-reviewer-member-id',
                            shouldOpenOpportunity: false,
                        }),
                    ],
                    status: 'ACTIVE',
                }))
        })
        expect(mockedShowErrorToast)
            .not.toHaveBeenCalledWith('Please fix validation errors before launching')
    })

    it('launches a read-only draft when AI reviewers appear before persisted human reviewer assignments', async () => {
        let launchAction: (() => Promise<void>) | undefined

        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'reviewer-role-id',
                name: 'Reviewer',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [{
                challengeId: '12345',
                memberId: 'approval-reviewer-member-id',
                role: 'Reviewer',
                roleId: 'reviewer-role-id',
            }],
        })
        mockedFetchResourcesService.mockResolvedValue([{
            challengeId: '12345',
            memberId: 'approval-reviewer-member-id',
            role: 'Reviewer',
            roleId: 'reviewer-role-id',
        }])
        mockedPatchChallenge.mockResolvedValue({
            ...validDraftChallenge,
            phases: [{
                duration: 24,
                name: 'Approval',
                phaseId: 'approval-phase-id',
            }],
            reviewers: [
                {
                    aiWorkflowId: 'workflow-1',
                    isMemberReview: false,
                    phaseId: 'approval-phase-id',
                },
                {
                    isMemberReview: true,
                    memberId: 'approval-reviewer-member-id',
                    memberReviewerCount: 1,
                    phaseId: 'approval-phase-id',
                    scorecardId: 'approval-scorecard-id',
                    shouldOpenOpportunity: false,
                },
            ],
            status: 'ACTIVE',
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...validDraftChallenge,
                        phases: [{
                            duration: 24,
                            name: 'Approval',
                            phaseId: 'approval-phase-id',
                        }],
                        reviewers: [
                            {
                                aiWorkflowId: 'workflow-1',
                                isMemberReview: false,
                                phaseId: 'approval-phase-id',
                            },
                            {
                                isMemberReview: true,
                                memberReviewerCount: 1,
                                phaseId: 'approval-phase-id',
                                scorecardId: 'approval-scorecard-id',
                                shouldOpenOpportunity: false,
                            },
                        ],
                    }}
                    isReadOnly
                    onRegisterLaunchAction={action => {
                        launchAction = action
                    }}
                />
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(launchAction)
                .toEqual(expect.any(Function))
        })

        await act(async () => {
            await launchAction?.()
                .catch(() => undefined)
        })

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledWith('12345', expect.objectContaining({
                    reviewers: [
                        expect.objectContaining({
                            aiWorkflowId: 'workflow-1',
                            isMemberReview: false,
                            phaseId: 'approval-phase-id',
                        }),
                        expect.objectContaining({
                            memberId: 'approval-reviewer-member-id',
                            shouldOpenOpportunity: false,
                        }),
                    ],
                    status: 'ACTIVE',
                }))
        })
        expect(mockedShowErrorToast)
            .not.toHaveBeenCalledWith('Please fix validation errors before launching')
    })

    it('returns to view mode after launching from an edit route', async () => {
        let launchAction: (() => Promise<void>) | undefined

        mockedPatchChallenge.mockResolvedValue({
            ...validDraftChallenge,
            status: 'ACTIVE',
        })

        render(
            <MemoryRouter initialEntries={['/projects/100578/challenges/12345/edit']}>
                <LocationDisplay />
                <ChallengeEditorForm
                    challenge={validDraftChallenge}
                    projectId='100578'
                    onRegisterLaunchAction={action => {
                        launchAction = action
                    }}
                />
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(launchAction)
                .toEqual(expect.any(Function))
        })

        await act(async () => {
            await launchAction?.()
                .catch(() => undefined)
        })

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledWith('12345', expect.objectContaining({
                    status: 'ACTIVE',
                }))
            expect(screen.getByTestId('location-display'))
                .toHaveTextContent('/projects/100578/challenges/12345/view')
        })
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

    it('keeps submission-limit normalization pristine until initial resource hydration finishes', async () => {
        let resolveFetchedResources: ((value: unknown[]) => void) | undefined
        let resolveFetchedResourceRoles: ((value: unknown[]) => void) | undefined

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
                abbreviation: 'CH',
                id: 'design-challenge',
                name: 'Challenge',
            }],
            isLoading: false,
        })
        mockedFetchResourcesService.mockImplementation(
            () => new Promise(resolve => {
                resolveFetchedResources = resolve as (value: unknown[]) => void
            }),
        )
        mockedFetchResourceRolesService.mockImplementation(
            () => new Promise(resolve => {
                resolveFetchedResourceRoles = resolve as (value: unknown[]) => void
            }),
        )

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...draftChallenge,
                        trackId: 'design-track',
                        type: {
                            abbreviation: 'CH',
                            name: 'Challenge',
                        },
                        typeId: 'design-challenge',
                    }}
                />
            </MemoryRouter>,
        )

        expect(screen.getByTestId('maximum-submissions-field'))
            .toHaveAttribute('data-defer-dirty', 'true')

        await act(async () => {
            resolveFetchedResources?.([])
            resolveFetchedResourceRoles?.([])
        })

        await waitFor(() => {
            expect(screen.getByTestId('maximum-submissions-field'))
                .toHaveAttribute('data-defer-dirty', 'false')
        })
    })

    it('keeps the review section after submission settings in read-only mode', () => {
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
                    challenge={first2FinishDraftChallenge}
                    isReadOnly
                />
            </MemoryRouter>,
        )

        const sectionHeadings = screen.getAllByRole('heading', { level: 3 })
            .map(heading => heading.textContent)
        const timelineIndex = sectionHeadings.indexOf('Timeline & Schedule')
        const submissionSettingsIndex = sectionHeadings.indexOf('Submission Settings')
        const reviewIndex = sectionHeadings.indexOf('Review')

        expect(timelineIndex)
            .toBeGreaterThanOrEqual(0)
        expect(submissionSettingsIndex)
            .toBeGreaterThan(timelineIndex)
        expect(reviewIndex)
            .toBeGreaterThan(submissionSettingsIndex)
        expect(sectionHeadings)
            .not.toContain('Attachments')
        expect(screen.getByTestId('reviewers-field'))
            .toHaveAttribute('data-read-only', 'true')
        expect(screen.getByTestId('reviewers-field')
            .closest('fieldset[disabled]'))
            .toBeNull()
    })

    it('does not delete manual iterative reviewer resources when saving a first2finish draft', async () => {
        const user = userEvent.setup()

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
                isTask: false,
                name: 'First2Finish',
            }],
            isLoading: false,
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'iterative-reviewer-role-id',
                name: 'Iterative Reviewer',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [{
                challengeId: '12345',
                memberHandle: 'taasiintake300',
                memberId: 'manual-reviewer-member-id',
                role: 'Iterative Reviewer',
                roleId: 'iterative-reviewer-role-id',
            }],
        })
        mockedPatchChallenge.mockResolvedValue(first2FinishDraftChallenge)

        render(
            <MemoryRouter>
                <ChallengeEditorForm challenge={first2FinishDraftChallenge} />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Challenge Name'), ' updated')
        await user.click(screen.getByRole('button', { name: 'Save Challenge' }))

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledTimes(1)
        })

        expect(mockedDeleteResource)
            .not.toHaveBeenCalled()
    })

    it('does not delete submitter resources when saving a non-task draft', async () => {
        const user = userEvent.setup()

        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [{
                abbreviation: 'CH',
                id: 'type-id',
                isTask: false,
                name: 'Challenge',
            }],
            isLoading: false,
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'submitter-role-id',
                name: 'Submitter',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [{
                challengeId: '12345',
                memberHandle: 'task-user',
                memberId: '12345',
                role: 'Submitter',
                roleId: 'submitter-role-id',
            }],
        })
        mockedPatchChallenge.mockResolvedValue({
            ...validDraftChallenge,
            type: {
                abbreviation: 'CH',
                name: 'Challenge',
            },
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...validDraftChallenge,
                        type: {
                            abbreviation: 'CH',
                            name: 'Challenge',
                        },
                    }}
                />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Challenge Name'), ' updated')
        await user.click(screen.getByRole('button', { name: 'Save Challenge' }))

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledTimes(1)
        })

        expect(mockedDeleteResource)
            .not.toHaveBeenCalled()
    })

    it('launches a first2finish draft with iterative reviewer resources without task-only validation', async () => {
        let launchAction: (() => Promise<void>) | undefined

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
                isTask: false,
                name: 'First2Finish',
            }],
            isLoading: false,
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'iterative-reviewer-role-id',
                name: 'Iterative Reviewer',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [{
                challengeId: '12345',
                memberHandle: 'taasiintake300',
                memberId: 'manual-reviewer-member-id',
                role: 'Iterative Reviewer',
                roleId: 'iterative-reviewer-role-id',
            }],
        })
        mockedPatchChallenge.mockResolvedValue({
            ...first2FinishDraftChallenge,
            status: 'ACTIVE',
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={first2FinishDraftChallenge}
                    onRegisterLaunchAction={action => {
                        launchAction = action
                    }}
                />
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(launchAction)
                .toEqual(expect.any(Function))
        })

        await act(async () => {
            await launchAction?.()
                .catch(() => undefined)
        })

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledWith('12345', expect.objectContaining({
                    status: 'ACTIVE',
                }))
        })
        expect(mockedShowErrorToast)
            .not.toHaveBeenCalledWith('Assign a member before launching a task challenge.')
    })

    it('launches a first2finish draft with legacy reviewer root fields without task-only validation', async () => {
        let launchAction: (() => Promise<void>) | undefined

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
                isTask: false,
                name: 'First2Finish',
            }],
            isLoading: false,
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'iterative-reviewer-role-id',
                name: 'Iterative Reviewer',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [{
                challengeId: '12345',
                memberHandle: 'taasiintake300',
                memberId: 'manual-reviewer-member-id',
                role: 'Iterative Reviewer',
                roleId: 'iterative-reviewer-role-id',
            }],
        })
        mockedPatchChallenge.mockResolvedValue({
            ...first2FinishDraftChallenge,
            reviewer: 'legacyTaskReviewer',
            status: 'ACTIVE',
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={{
                        ...first2FinishDraftChallenge,
                        reviewer: 'legacyTaskReviewer',
                    }}
                    onRegisterLaunchAction={action => {
                        launchAction = action
                    }}
                />
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(launchAction)
                .toEqual(expect.any(Function))
        })

        await act(async () => {
            await launchAction?.()
                .catch(() => undefined)
        })

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledWith('12345', expect.objectContaining({
                    status: 'ACTIVE',
                }))
        })
        expect(mockedShowErrorToast)
            .not.toHaveBeenCalledWith('Assign a member before launching a task challenge.')
    })

    it('blocks launch when the project billing account is inactive', async () => {
        let launchAction: (() => Promise<void>) | undefined
        let launchError: Error | undefined

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
                isTask: false,
                name: 'First2Finish',
            }],
            isLoading: false,
        })
        mockedUseFetchProjectBillingAccount.mockReturnValue({
            billingAccount: {
                active: false,
                id: '80001061',
            },
            isLoading: false,
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'iterative-reviewer-role-id',
                name: 'Iterative Reviewer',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [{
                challengeId: '12345',
                memberHandle: 'taasiintake300',
                memberId: 'manual-reviewer-member-id',
                role: 'Iterative Reviewer',
                roleId: 'iterative-reviewer-role-id',
            }],
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm
                    challenge={first2FinishDraftChallenge}
                    onRegisterLaunchAction={action => {
                        launchAction = action
                    }}
                />
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(launchAction)
                .toEqual(expect.any(Function))
        })

        await act(async () => {
            try {
                await (launchAction as () => Promise<void>)()
            } catch (error) {
                launchError = error as Error
            }
        })

        expect(launchError)
            .toEqual(expect.objectContaining({
                message: 'Cannot launch challenges because the project billing account is inactive.',
            }))
        expect(mockedPatchChallenge)
            .not.toHaveBeenCalled()
        expect(mockedShowErrorToast)
            .toHaveBeenCalledWith(
                'Cannot launch challenges because the project billing account is inactive.',
            )
        expect(mockedShowErrorToast)
            .not.toHaveBeenCalledWith('Failed to save challenge')
    })

    it('does not render the attachments section while editing a draft', () => {
        render(
            <MemoryRouter>
                <ChallengeEditorForm challenge={validDraftChallenge} />
            </MemoryRouter>,
        )

        expect(screen.queryByRole('heading', { level: 3, name: 'Attachments' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Mock Add Attachment' }))
            .not.toBeInTheDocument()
    })

    it('returns to view mode after saving from an edit route', async () => {
        const user = userEvent.setup()

        mockedPatchChallenge.mockResolvedValue(validDraftChallenge)

        render(
            <MemoryRouter initialEntries={['/projects/100578/challenges/12345/edit']}>
                <LocationDisplay />
                <ChallengeEditorForm
                    challenge={validDraftChallenge}
                    projectId='100578'
                />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Challenge Name'), ' updated')
        await user.click(screen.getByRole('button', { name: 'Save Challenge' }))

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledTimes(1)
            expect(screen.getByTestId('location-display'))
                .toHaveTextContent('/projects/100578/challenges/12345/view')
        })
    })

    it('refreshes phase data when the fetched challenge updates for the same id', async () => {
        const initialChallenge = {
            ...validDraftChallenge,
            phases: [{
                duration: 1440,
                name: 'Submission',
                phaseId: 'submission-phase-id',
                scheduledEndDate: '2026-04-17T04:58:51.000Z',
                scheduledStartDate: '2026-04-11T04:58:51.000Z',
            }],
            updated: '2026-04-13T01:00:00.000Z',
        } as Challenge
        const refreshedChallenge = {
            ...initialChallenge,
            phases: [{
                ...initialChallenge.phases?.[0],
                scheduledEndDate: '2026-04-18T04:58:51.000Z',
            }],
            updated: '2026-04-13T01:05:00.000Z',
        } as Challenge

        const renderResult = render(
            <MemoryRouter>
                <ChallengeEditorForm challenge={initialChallenge} />
            </MemoryRouter>,
        )

        expect(screen.getByTestId('challenge-schedule-section'))
            .toHaveAttribute('data-first-phase-end', '2026-04-17T04:58:51.000Z')

        renderResult.rerender(
            <MemoryRouter>
                <ChallengeEditorForm challenge={refreshedChallenge} />
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(screen.getByTestId('challenge-schedule-section'))
                .toHaveAttribute('data-first-phase-end', '2026-04-18T04:58:51.000Z')
        })
    })

    it('returns to view mode after saving a new draft from the create route', async () => {
        const user = userEvent.setup()

        mockedPatchChallenge.mockResolvedValue({
            ...validDraftChallenge,
            status: 'DRAFT',
        })

        render(
            <MemoryRouter initialEntries={['/projects/100578/challenges/new']}>
                <LocationDisplay />
                <ChallengeEditorForm
                    challenge={validNewChallenge}
                    projectId='100578'
                />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Challenge Name'), ' updated')
        await user.click(screen.getByRole('button', { name: 'Save as Draft' }))

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledTimes(1)
            expect(screen.getByTestId('location-display'))
                .toHaveTextContent('/projects/100578/challenges/12345/view')
        })
    })

    it('returns to view mode after saving from an edit route with a trailing slash', async () => {
        const user = userEvent.setup()

        mockedPatchChallenge.mockResolvedValue(validDraftChallenge)

        render(
            <MemoryRouter initialEntries={['/projects/100578/challenges/12345/edit/']}>
                <LocationDisplay />
                <ChallengeEditorForm
                    challenge={validDraftChallenge}
                    projectId='100578'
                />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Challenge Name'), ' updated')
        await user.click(screen.getByRole('button', { name: 'Save Challenge' }))

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledTimes(1)
            expect(screen.getByTestId('location-display'))
                .toHaveTextContent('/projects/100578/challenges/12345/view')
        })
    })

    it('clears Marathon Match when a new challenge switches to the Design track', async () => {
        const user = userEvent.setup()

        mockedUseFetchChallengeTracks.mockReturnValue({
            isLoading: false,
            tracks: [
                {
                    id: 'development-track',
                    name: 'Development',
                    track: 'DEVELOPMENT',
                },
                {
                    id: 'design-track',
                    name: 'Design',
                    track: 'DESIGN',
                },
            ],
        })
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [{
                abbreviation: 'MM',
                id: 'marathon-match-id',
                isActive: true,
                isTask: false,
                name: 'Marathon Match',
            }],
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm />
            </MemoryRouter>,
        )

        const challengeTrackInput = screen.getByLabelText('Challenge Track') as HTMLInputElement
        const challengeTypeInput = screen.getByLabelText('Challenge Type') as HTMLInputElement

        await user.type(challengeTrackInput, 'development-track')
        await user.type(challengeTypeInput, 'marathon-match-id')

        expect(challengeTypeInput.value)
            .toBe('marathon-match-id')

        await user.clear(challengeTrackInput)
        await user.type(challengeTrackInput, 'design-track')

        await waitFor(() => {
            expect(challengeTypeInput.value)
                .toBe('')
        })
    })

    it('prevents creating a design challenge without a work type', async () => {
        const user = userEvent.setup()

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
                abbreviation: 'CH',
                id: 'design-challenge',
                isActive: true,
                isTask: false,
                name: 'Challenge',
            }],
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ChallengeEditorForm projectId='12345' />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Challenge Name'), 'Design challenge')
        await user.type(screen.getByLabelText('Challenge Track'), 'design-track')
        await user.type(screen.getByLabelText('Challenge Type'), 'design-challenge')

        await waitFor(() => {
            expect(screen.getByLabelText('Work Type'))
                .toBeTruthy()
        })

        await user.click(screen.getByRole('button', { name: 'New' }))

        await waitFor(() => {
            expect(mockedCreateChallenge)
                .not.toHaveBeenCalled()
            expect(screen.getByText('Select a work type'))
                .toBeTruthy()
        })
    })

    it('clears a stale create error when work type validation blocks a retry', async () => {
        const user = userEvent.setup()

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
                abbreviation: 'CH',
                id: 'design-challenge',
                isActive: true,
                isTask: false,
                name: 'Challenge',
            }],
            isLoading: false,
        })
        mockedCreateChallenge.mockRejectedValueOnce(new Error('Original create failure'))

        render(
            <MemoryRouter>
                <ChallengeEditorForm projectId='12345' />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Challenge Name'), 'Design challenge')
        await user.type(screen.getByLabelText('Challenge Track'), 'design-track')
        await user.type(screen.getByLabelText('Challenge Type'), 'design-challenge')
        await user.type(screen.getByLabelText('Work Type'), 'Web Design')
        await user.click(screen.getByRole('button', { name: 'New' }))

        await waitFor(() => {
            expect(screen.getByText('Original create failure'))
                .toBeTruthy()
        })

        await user.clear(screen.getByLabelText('Work Type'))
        await user.click(screen.getByRole('button', { name: 'New' }))

        await waitFor(() => {
            expect(screen.getByText('Select a work type'))
                .toBeTruthy()
            expect(screen.queryByText('Original create failure'))
                .toBeNull()
        })
    })

    it('creates a forum discussion for forum-enabled challenge types', async () => {
        const user = userEvent.setup()

        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [{
                abbreviation: 'CH',
                id: '927abff4-7af9-4145-8ba1-577c16e64e2e',
                isActive: true,
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

    it('keeps the created challenge sections visible after creating from the new route', async () => {
        const user = userEvent.setup()

        mockedCreateChallenge.mockResolvedValue({
            id: 'created-challenge-id',
            name: 'Created Draft Challenge',
            status: 'NEW',
        })
        mockedFetchChallenge.mockResolvedValue({
            id: 'created-challenge-id',
            name: 'Created Draft Challenge',
            status: 'NEW',
            trackId: 'track-id',
            typeId: 'type-id',
        })

        render(
            <MemoryRouter initialEntries={['/projects/12345/challenges/new']}>
                <ChallengeEditorForm projectId='12345' />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Challenge Name'), 'Created Draft Challenge')
        await user.type(screen.getByLabelText('Challenge Track'), 'track-id')
        await user.type(screen.getByLabelText('Challenge Type'), 'type-id')
        await user.click(screen.getByRole('button', { name: 'New' }))

        await waitFor(() => {
            expect(screen.getByText('Specification'))
                .toBeInTheDocument()
        })

        await act(async () => {
            await Promise.resolve()
        })

        await waitFor(() => {
            expect(screen.getByText('Specification'))
                .toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Save as Draft' }))
                .toBeInTheDocument()
            expect(screen.queryByRole('button', { name: 'New' }))
                .toBeNull()
        })
    })
})
