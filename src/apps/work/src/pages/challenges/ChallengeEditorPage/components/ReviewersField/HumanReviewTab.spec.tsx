/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import {
    FormProvider,
    UseControllerReturn,
    useForm,
} from 'react-hook-form'

import {
    useFetchChallengeTracks,
    useFetchChallengeTypes,
    useFetchResourceRoles,
    useFetchResources,
} from '../../../../../lib/hooks'
import {
    fetchDefaultReviewers,
    fetchScorecards,
} from '../../../../../lib/services'
import {
    ChallengeEditorFormData,
} from '../../../../../lib/models'

import HumanReviewTab from './HumanReviewTab'
import styles from './ReviewersField.module.scss'

jest.mock('../../../../../lib/components/form', () => ({
    FormSelectField: (props: {
        className?: string
        label: string
        name: string
    }) => (
        <div
            className={props.className}
            data-testid={props.name}
        >
            <span>{props.label}</span>
        </div>
    ),
    FormTextField: (props: {
        label: string
        name: string
    }) => (
        <div data-testid={props.name}>
            <span>{props.label}</span>
        </div>
    ),
    FormUserAutocomplete: (props: {
        label: string
        name: string
    }) => {
        const {
            useController,
            useFormContext,
        }: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const formContext = useFormContext()
        const controller: UseControllerReturn = useController({
            control: formContext.control,
            name: props.name,
        })

        return (
            <div data-testid={props.name} data-value={controller.field.value || ''}>
                <span>{props.label}</span>
            </div>
        )
    },
}))
jest.mock('../../../../../lib/hooks', () => ({
    useFetchChallengeTracks: jest.fn(),
    useFetchChallengeTypes: jest.fn(),
    useFetchResourceRoles: jest.fn(),
    useFetchResources: jest.fn(),
}))
jest.mock('../../../../../lib/services', () => ({
    createResource: jest.fn(),
    deleteResource: jest.fn(),
    fetchDefaultReviewers: jest.fn(),
    fetchScorecards: jest.fn(),
    updateResourceRoleAssignment: jest.fn(),
}))
jest.mock('../../../../../lib/utils', () => ({
    calculateEstimatedReviewerCost: () => 3.45,
    getFirstPlacePrizeValue: () => 0,
}))
jest.mock('~/libs/ui', () => ({
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
    }) => (
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

const mockedUseFetchChallengeTracks = useFetchChallengeTracks as jest.Mock
const mockedUseFetchChallengeTypes = useFetchChallengeTypes as jest.Mock
const mockedUseFetchResourceRoles = useFetchResourceRoles as jest.Mock
const mockedUseFetchResources = useFetchResources as jest.Mock
const mockedFetchDefaultReviewers = fetchDefaultReviewers as jest.Mock
const mockedFetchScorecards = fetchScorecards as jest.Mock

function createPendingPromise(): Promise<never> {
    return new Promise(() => {
        // Intentionally unresolved to avoid async state updates in this layout test.
    })
}

interface TestHarnessProps {
    defaultValues?: ChallengeEditorFormData
    showMemberValue?: boolean
}

function buildDefaultValues(): ChallengeEditorFormData {
    return {
        description: 'Reviewer assignment regression test description.',
        id: 'challenge-1',
        name: 'Reviewer assignment regression test',
        phases: [
            {
                id: 'phase-1',
                name: 'Iterative Review',
                phaseId: 'phase-1',
            },
        ],
        prizeSets: [],
        reviewers: [
            {
                additionalMemberIds: [],
                isMemberReview: true,
                memberId: 'member-1',
                memberReviewerCount: 1,
                phaseId: 'phase-1',
                roleId: 'role-1',
                scorecardId: 'scorecard-1',
            },
        ],
        skills: [],
        tags: [],
        trackId: 'track-1',
        typeId: 'type-1',
    }
}

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: props.defaultValues || buildDefaultValues(),
    })

    return (
        <FormProvider {...formMethods}>
            <HumanReviewTab />
            {props.showMemberValue
                ? (
                    <div data-testid='member-id-value'>
                        {formMethods.watch('reviewers.0.memberId') || ''}
                    </div>
                )
                : undefined}
        </FormProvider>
    )
}

describe('HumanReviewTab', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [
                {
                    id: 'track-1',
                    name: 'Development',
                    track: 'DEVELOPMENT',
                },
            ],
        })
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [
                {
                    id: 'type-1',
                    name: 'First2Finish',
                },
            ],
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            resourceRoles: [
                {
                    id: 'role-1',
                    name: 'Iterative Reviewer',
                },
            ],
        })
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            mutate: jest.fn()
                .mockResolvedValue(undefined),
            resources: [],
        })
        mockedFetchDefaultReviewers.mockImplementation(() => createPendingPromise())
        mockedFetchScorecards.mockImplementation(() => createPendingPromise())
    })

    it('groups the phase and scorecard fields into the shared primary row', async () => {
        render(<TestHarness />)

        await waitFor(() => {
            expect(mockedFetchScorecards)
                .toHaveBeenCalled()
        })

        const phaseRow = screen.getByText('Phase')
            .closest(`.${styles.primaryFields}`)
        const scorecardRow = screen.getByText('Scorecard')
            .closest(`.${styles.primaryFields}`)

        expect(phaseRow).not.toBeNull()
        expect(scorecardRow)
            .toBe(phaseRow)
        expect(screen.getByText('Assign member(s):').parentElement?.className)
            .toContain(styles.memberAssignments)
        expect(screen.getByRole('button', { name: 'Add reviewer' }))
            .not.toBeNull()
        expect(screen.queryByRole('button', { name: 'Apply default reviewers' }))
            .toBeNull()
    })

    it('restores iterative reviewer member ids from the iterative review role alias', async () => {
        mockedUseFetchResourceRoles.mockReturnValue({
            resourceRoles: [
                {
                    id: 'role-iterative-review',
                    name: 'Iterative Review',
                },
            ],
        })
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            mutate: jest.fn()
                .mockResolvedValue(undefined),
            resources: [
                {
                    memberId: 'member-2',
                    roleId: 'role-iterative-review',
                },
            ],
        })

        render(
            <TestHarness
                defaultValues={{
                    ...buildDefaultValues(),
                    reviewers: [
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'phase-1',
                            scorecardId: 'scorecard-1',
                        },
                    ],
                }}
                showMemberValue
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('member-id-value').textContent)
                .toBe('member-2')
        })
    })
})
