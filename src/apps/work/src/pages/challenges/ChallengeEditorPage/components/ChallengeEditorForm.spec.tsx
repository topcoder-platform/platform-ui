/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import {
    useAutosave,
    useFetchChallengeTracks,
    useFetchChallengeTypes,
    useFetchResourceRoles,
    useFetchResources,
    useFetchTimelineTemplates,
} from '../../../../lib/hooks'

import { ChallengeEditorForm } from './ChallengeEditorForm'

jest.mock('../../../../lib/components/form', () => ({
    FormCheckboxField: () => <></>,
}))
jest.mock('../../../../lib/hooks', () => ({
    useAutosave: jest.fn(),
    useFetchChallengeTracks: jest.fn(),
    useFetchChallengeTypes: jest.fn(),
    useFetchResourceRoles: jest.fn(),
    useFetchResources: jest.fn(),
    useFetchTimelineTemplates: jest.fn(),
}))
jest.mock('../../../../lib/services', () => ({
    createChallenge: jest.fn(),
    createResource: jest.fn(),
    deleteResource: jest.fn(),
    fetchChallenge: jest.fn(),
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
        disabled?: boolean
        label: string
        onClick?: () => void
        type?: 'button' | 'submit'
    }) => (
        <button
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
    ChallengeTrackField: () => <></>,
}))
jest.mock('./ChallengeTypeField', () => ({
    ChallengeTypeField: () => <></>,
}))
jest.mock('./CheckpointPrizesField', () => ({
    CheckpointPrizesField: () => <></>,
}))
jest.mock('./CopilotField', () => ({
    CopilotField: () => <></>,
}))
jest.mock('./CopilotFeeField', () => ({
    CopilotFeeField: () => <></>,
}))
jest.mock('./DesignWorkTypeField', () => ({
    DesignWorkTypeField: () => <></>,
}))
jest.mock('./FunChallengeField', () => ({
    FunChallengeField: () => <></>,
}))
jest.mock('./GroupsField', () => ({
    GroupsField: () => <></>,
}))
jest.mock('./MaximumSubmissionsField', () => ({
    MaximumSubmissionsField: () => <></>,
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
    StockArtsField: () => <></>,
}))
jest.mock('./SubmissionVisibilityField', () => ({
    SubmissionVisibilityField: () => <></>,
}))
jest.mock('./TermsField', () => ({
    TermsField: () => <></>,
}))

const mockedUseAutosave = useAutosave as jest.Mock
const mockedUseFetchChallengeTracks = useFetchChallengeTracks as jest.Mock
const mockedUseFetchChallengeTypes = useFetchChallengeTypes as jest.Mock
const mockedUseFetchResourceRoles = useFetchResourceRoles as jest.Mock
const mockedUseFetchResources = useFetchResources as jest.Mock
const mockedUseFetchTimelineTemplates = useFetchTimelineTemplates as jest.Mock

describe('ChallengeEditorForm', () => {
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
})
