/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import type {
    ChangeEvent,
} from 'react'
import {
    useEffect,
    useRef,
} from 'react'
import {
    FormProvider,
    UseControllerReturn,
    useForm,
    useFormContext as useReactHookFormContext,
    useWatch,
} from 'react-hook-form'

import {
    useFetchChallengeTracks,
    useFetchChallengeTypes,
    useFetchResourceRoles,
    useFetchResources,
} from '../../../../../lib/hooks'
import {
    MAX_MANUAL_REVIEWER_COUNT,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    deleteResource,
    fetchDefaultReviewers,
    fetchProfile,
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
        options?: Array<{
            label: string
            value: string
        }>
        placeholder?: string
        toFieldValue?: (selected: {
            label: string
            value: string
        } | undefined) => unknown
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
        const selectedValue = typeof controller.field.value === 'string'
            ? controller.field.value
            : ''
        const errorMessage = controller.fieldState.error?.message

        function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
            const nextSelected = (props.options || [])
                .find(option => option.value === event.target.value)
            const nextValue = props.toFieldValue
                ? props.toFieldValue(nextSelected)
                : event.target.value

            controller.field.onChange(nextValue)
        }

        return (
            <div
                className={props.className}
                data-options={JSON.stringify(props.options || [])}
                data-testid={props.name}
                data-value={selectedValue}
            >
                <label htmlFor={props.name}>{props.label}</label>
                <select
                    aria-label={props.label}
                    id={props.name}
                    onChange={handleChange}
                    value={selectedValue}
                >
                    <option value=''>{props.placeholder || ''}</option>
                    {(props.options || [])
                        .map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                </select>
                {errorMessage
                    ? <div data-testid={`${props.name}-error`}>{errorMessage}</div>
                    : undefined}
            </div>
        )
    },
    FormTextField: (props: {
        label: string
        max?: number
        min?: number
        name: string
        sanitize?: (value: string) => string
        type?: 'number' | 'text'
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
        const value = typeof controller.field.value === 'number'
            ? String(controller.field.value)
            : (controller.field.value || '')

        function handleChange(event: ChangeEvent<HTMLInputElement>): void {
            const nextValue = props.sanitize
                ? props.sanitize(event.target.value)
                : event.target.value

            controller.field.onChange(nextValue)
        }

        return (
            <div data-testid={props.name}>
                <label htmlFor={props.name}>{props.label}</label>
                <input
                    aria-label={props.label}
                    id={props.name}
                    max={props.max}
                    min={props.min}
                    onChange={handleChange}
                    type={props.type || 'text'}
                    value={value}
                />
            </div>
        )
    },
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
    fetchProfile: jest.fn(),
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
const mockedDeleteResource = deleteResource as jest.Mock
const mockedFetchDefaultReviewers = fetchDefaultReviewers as jest.Mock
const mockedFetchProfile = fetchProfile as jest.Mock
const mockedFetchScorecards = fetchScorecards as jest.Mock

interface DeferredPromise<T> {
    promise: Promise<T>
    resolve: (value: T) => void
}

function createPendingPromise(): Promise<never> {
    return new Promise(() => {
        // Intentionally unresolved to avoid async state updates in this layout test.
    })
}

function createDeferredPromise<T>(): DeferredPromise<T> {
    let resolve: (value: T) => void = () => undefined

    const promise = new Promise<T>(nextResolve => {
        resolve = nextResolve
    })

    return {
        promise,
        resolve,
    }
}

interface TestHarnessProps {
    defaultValues?: Partial<ChallengeEditorFormData>
    initialScorecardErrorMessage?: string
    restoreStaleAdditionalMemberIds?: boolean
    showAdditionalMemberIdsValue?: boolean
    showMemberValue?: boolean
    showScorecardValue?: boolean
}

const baseDefaultValues: ChallengeEditorFormData = {
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

function getPhaseOptionLabels(fieldName: string): string[] {
    const serializedOptions = screen.getByTestId(fieldName)
        .getAttribute('data-options')

    if (!serializedOptions) {
        return []
    }

    return (JSON.parse(serializedOptions) as Array<{
        label: string
        value: string
    }>)
        .map(option => option.label)
}

/**
 * Simulates React Hook Form continuing to report a hidden blank member slot
 * after the reviewer count cleanup tries to unregister it.
 *
 * @returns render-count marker used to detect runaway cleanup loops.
 * @throws when the regression produces repeated trim/re-register renders.
 */
const StaleAdditionalMemberIdsReporter = (): JSX.Element => {
    const formContext = useReactHookFormContext<ChallengeEditorFormData>()
    const renderCountRef = useRef<number>(0)
    const reviewerCount = useWatch({
        control: formContext.control,
        name: 'reviewers.0.memberReviewerCount',
    }) as number | string | undefined
    const additionalMemberIds = useWatch({
        control: formContext.control,
        name: 'reviewers.0.additionalMemberIds',
    }) as string[] | undefined

    renderCountRef.current += 1
    if (renderCountRef.current > 20) {
        throw new Error('Reviewer count cleanup looped')
    }

    useEffect(() => {
        if (
            String(reviewerCount) !== '1'
            || additionalMemberIds !== undefined
        ) {
            return
        }

        formContext.setValue('reviewers.0.additionalMemberIds', [''], {
            shouldDirty: false,
            shouldValidate: false,
        })
    }, [
        additionalMemberIds,
        formContext,
        reviewerCount,
    ])

    return <div data-testid='stale-additional-member-renders'>{renderCountRef.current}</div>
}

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            ...baseDefaultValues,
            ...props.defaultValues,
        },
    })

    useEffect(() => {
        if (!props.initialScorecardErrorMessage) {
            return
        }

        formMethods.setError('reviewers.0.scorecardId', {
            message: props.initialScorecardErrorMessage,
            type: 'manual',
        })
    }, [
        formMethods,
        props.initialScorecardErrorMessage,
    ])

    return (
        <FormProvider {...formMethods}>
            <HumanReviewTab />
            {props.restoreStaleAdditionalMemberIds
                ? <StaleAdditionalMemberIdsReporter />
                : undefined}
            {props.showAdditionalMemberIdsValue
                ? (
                    <div data-testid='additional-member-ids-value'>
                        {formMethods.watch('reviewers.0.additionalMemberIds') === undefined
                            ? 'undefined'
                            : JSON.stringify(formMethods.watch('reviewers.0.additionalMemberIds'))}
                    </div>
                )
                : undefined}
            {props.showMemberValue
                ? (
                    <div data-testid='member-id-value'>
                        {formMethods.watch('reviewers.0.memberId') || ''}
                    </div>
                )
                : undefined}
            {props.showScorecardValue
                ? (
                    <div data-testid='scorecard-id-value'>
                        {formMethods.watch('reviewers.0.scorecardId') || ''}
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
        mockedDeleteResource.mockResolvedValue(undefined)
        mockedFetchDefaultReviewers.mockImplementation(() => createPendingPromise())
        mockedFetchProfile.mockResolvedValue(undefined)
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

    it('renders the legacy review type dropdown on manual reviewer cards', () => {
        render(<TestHarness />)

        expect(screen.getByTestId('reviewers.0.type'))
            .not.toBeNull()
        expect(getPhaseOptionLabels('reviewers.0.type'))
            .toEqual([
                'Regular Review',
                'Component Dev Review',
                'Spec Review',
                'Iterative Review',
                'Scenarios Review',
            ])
    })

    it('backfills the iterative review type for legacy manual reviewer rows', async () => {
        render(<TestHarness />)

        await waitFor(() => {
            expect(screen.getByTestId('reviewers.0.type')
                .getAttribute('data-value'))
                .toBe('ITERATIVE_REVIEW')
        })
    })

    it('upgrades auto-backfilled reviewer types when default reviewers load later', async () => {
        const resolvedDefaultReviewers = [
            {
                isMemberReview: true,
                memberReviewerCount: 1,
                opportunityType: 'COMPONENT_DEV_REVIEW',
                phaseId: 'phase-1',
                roleId: 'role-1',
                scorecardId: 'scorecard-1',
            },
        ]
        const deferredDefaultReviewers = createDeferredPromise<typeof resolvedDefaultReviewers>()

        mockedFetchDefaultReviewers.mockReturnValue(deferredDefaultReviewers.promise)

        render(<TestHarness />)

        await waitFor(() => {
            expect(screen.getByTestId('reviewers.0.type')
                .getAttribute('data-value'))
                .toBe('ITERATIVE_REVIEW')
        })

        await act(async () => {
            deferredDefaultReviewers.resolve(resolvedDefaultReviewers)
        })

        await waitFor(() => {
            expect(screen.getByTestId('reviewers.0.type')
                .getAttribute('data-value'))
                .toBe('COMPONENT_DEV_REVIEW')
        })
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

    it('restores iterative reviewer member ids from the generic reviewer role fallback', async () => {
        mockedUseFetchResourceRoles.mockReturnValue({
            resourceRoles: [
                {
                    id: 'role-reviewer',
                    name: 'Reviewer',
                },
            ],
        })
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            mutate: jest.fn()
                .mockResolvedValue(undefined),
            resources: [
                {
                    memberId: 'member-3',
                    roleId: 'role-reviewer',
                },
            ],
        })

        render(
            <TestHarness
                defaultValues={{
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
                .toBe('member-3')
        })
    })

    it('restores reviewer member ids when persisted resources only expose the reviewer role name', async () => {
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            mutate: jest.fn()
                .mockResolvedValue(undefined),
            resources: [
                {
                    memberId: 'member-4',
                    role: 'Reviewer',
                    roleId: '',
                },
            ],
        })

        render(
            <TestHarness
                defaultValues={{
                    phases: [
                        {
                            id: 'phase-1',
                            name: 'Review',
                            phaseId: 'phase-1',
                        },
                    ],
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
                .toBe('member-4')
        })
    })

    it('hydrates approval reviewers from handle-only generic reviewer resources', async () => {
        mockedUseFetchResourceRoles.mockReturnValue({
            resourceRoles: [{
                id: 'role-reviewer',
                name: 'Reviewer',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            mutate: jest.fn()
                .mockResolvedValue(undefined),
            resources: [{
                memberHandle: 'approval-user',
                roleId: 'role-reviewer',
            }],
        })
        mockedFetchProfile.mockResolvedValue({
            handle: 'approval-user',
            userId: 'member-approval',
        })

        render(
            <TestHarness
                defaultValues={{
                    phases: [{
                        id: 'approval-phase',
                        name: 'Approval',
                        phaseId: 'approval-phase',
                    }],
                    reviewers: [{
                        additionalMemberIds: [],
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'approval-phase',
                        scorecardId: 'scorecard-1',
                    }],
                }}
                showMemberValue
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('member-id-value').textContent)
                .toBe('member-approval')
        })
    })

    it('checks public review opportunity by default when the default reviewer opens it', async () => {
        mockedFetchDefaultReviewers.mockResolvedValue([
            {
                isMemberReview: true,
                memberReviewerCount: 1,
                phaseId: 'phase-1',
                roleId: 'role-1',
                scorecardId: 'scorecard-1',
                shouldOpenOpportunity: true,
            },
        ])
        mockedFetchScorecards.mockResolvedValue([
            {
                id: 'scorecard-1',
                name: 'Scorecard 1',
                phaseId: 'phase-1',
            },
        ])

        render(
            <TestHarness
                defaultValues={{
                    reviewers: [],
                }}
            />,
        )

        await waitFor(() => {
            expect(mockedFetchDefaultReviewers)
                .toHaveBeenCalledWith('type-1', 'track-1')
        })
        await waitFor(() => {
            expect((screen.getByRole('button', { name: 'Add reviewer' }) as HTMLButtonElement).disabled)
                .toBe(false)
        })

        fireEvent.click(screen.getByRole('button', { name: 'Add reviewer' }))

        await waitFor(() => {
            expect((
                screen.getByRole('checkbox', { name: 'Open public review opportunity' }) as HTMLInputElement
            ).checked)
                .toBe(true)
        })
    })

    it('defaults new manual reviewer cards to regular review type', async () => {
        mockedFetchScorecards.mockResolvedValue([])

        render(
            <TestHarness
                defaultValues={{
                    reviewers: [],
                }}
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('button', { name: 'Add reviewer' }) as HTMLButtonElement).disabled)
                .toBe(false)
        })

        fireEvent.click(screen.getByRole('button', { name: 'Add reviewer' }))

        await waitFor(() => {
            expect(screen.getByTestId('reviewers.0.type')
                .getAttribute('data-value'))
                .toBe('REGULAR_REVIEW')
        })
    })

    it('caps assignment fields when closed-opportunity reviewer count is too large', async () => {
        render(<TestHarness />)

        fireEvent.change(
            within(screen.getByTestId('reviewers.0.memberReviewerCount'))
                .getByRole('spinbutton', { name: 'Reviewer Count' }),
            {
                target: {
                    value: String(MAX_MANUAL_REVIEWER_COUNT + 5),
                },
            },
        )

        await waitFor(() => {
            expect((
                within(screen.getByTestId('reviewers.0.memberReviewerCount'))
                    .getByRole('spinbutton', { name: 'Reviewer Count' }) as HTMLInputElement
            ).value)
                .toBe(String(MAX_MANUAL_REVIEWER_COUNT))
        })
        expect(screen.getByTestId(`reviewers.0.additionalMemberIds.${MAX_MANUAL_REVIEWER_COUNT - 2}`))
            .not.toBeNull()
        expect(screen.queryByTestId(`reviewers.0.additionalMemberIds.${MAX_MANUAL_REVIEWER_COUNT - 1}`))
            .toBeNull()
    })

    it('removes blank assignment slots without deleting resources after closing public opportunity', async () => {
        render(
            <TestHarness
                defaultValues={{
                    reviewers: [
                        {
                            additionalMemberIds: [''],
                            isMemberReview: true,
                            memberId: '',
                            memberReviewerCount: 2,
                            phaseId: 'phase-1',
                            roleId: 'role-1',
                            scorecardId: 'scorecard-1',
                            shouldOpenOpportunity: true,
                        },
                    ],
                }}
                showAdditionalMemberIdsValue
            />,
        )

        fireEvent.click(screen.getByLabelText('Open public review opportunity'))

        expect(screen.getByTestId('reviewers.0.additionalMemberIds.0'))
            .not.toBeNull()

        fireEvent.change(
            within(screen.getByTestId('reviewers.0.memberReviewerCount'))
                .getByRole('spinbutton', { name: 'Reviewer Count' }),
            {
                target: {
                    value: '1',
                },
            },
        )

        await waitFor(() => {
            expect(screen.queryByTestId('reviewers.0.additionalMemberIds.0'))
                .toBeNull()
        })
        expect(screen.getByTestId('additional-member-ids-value').textContent)
            .toBe('undefined')
        expect(mockedDeleteResource)
            .not.toHaveBeenCalled()
    })

    it('does not repeat reviewer count cleanup when a hidden blank slot is still reported', async () => {
        render(
            <TestHarness
                defaultValues={{
                    reviewers: [
                        {
                            additionalMemberIds: [''],
                            isMemberReview: true,
                            memberId: '',
                            memberReviewerCount: 2,
                            phaseId: 'phase-1',
                            roleId: 'role-1',
                            scorecardId: 'scorecard-1',
                            shouldOpenOpportunity: false,
                        },
                    ],
                }}
                restoreStaleAdditionalMemberIds
            />,
        )

        fireEvent.change(
            within(screen.getByTestId('reviewers.0.memberReviewerCount'))
                .getByRole('spinbutton', { name: 'Reviewer Count' }),
            {
                target: {
                    value: '1',
                },
            },
        )

        await waitFor(() => {
            expect(screen.getByTestId('stale-additional-member-renders'))
                .not.toBeNull()
        })
        expect(screen.queryByTestId('reviewers.0.additionalMemberIds.0'))
            .toBeNull()
        expect(mockedDeleteResource)
            .not.toHaveBeenCalled()
    })

    it('hides appeal phases for manual reviewer cards across challenge types', () => {
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [
                {
                    id: 'type-1',
                    name: 'Code',
                },
            ],
        })

        render(
            <TestHarness
                defaultValues={{
                    phases: [
                        {
                            id: 'review',
                            name: 'Review',
                            phaseId: 'review',
                        },
                        {
                            id: 'appeals',
                            name: 'Appeals',
                            phaseId: 'appeals',
                        },
                        {
                            id: 'appeals-response',
                            name: 'Appeals Response',
                            phaseId: 'appeals-response',
                        },
                    ],
                }}
            />,
        )

        expect(getPhaseOptionLabels('reviewers.0.phaseId'))
            .toEqual(['Review'])
    })

    it('shows only unassigned non-submission phases on each reviewer card', () => {
        render(
            <TestHarness
                defaultValues={{
                    phases: [
                        {
                            id: 'registration',
                            name: 'Registration',
                            phaseId: 'registration',
                        },
                        {
                            id: 'submission',
                            name: 'Submission',
                            phaseId: 'submission',
                        },
                        {
                            id: 'screening',
                            name: 'Screening',
                            phaseId: 'screening',
                        },
                        {
                            id: 'review',
                            name: 'Review',
                            phaseId: 'review',
                        },
                        {
                            id: 'approval',
                            name: 'Approval',
                            phaseId: 'approval',
                        },
                    ],
                    reviewers: [
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberId: 'member-1',
                            memberReviewerCount: 1,
                            phaseId: 'review',
                            roleId: 'role-1',
                            scorecardId: 'scorecard-1',
                        },
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberId: 'member-2',
                            memberReviewerCount: 1,
                            phaseId: 'approval',
                            roleId: 'role-2',
                            scorecardId: 'scorecard-2',
                        },
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberId: 'member-3',
                            memberReviewerCount: 1,
                            roleId: 'role-3',
                            scorecardId: 'scorecard-3',
                        },
                    ],
                }}
            />,
        )

        expect(getPhaseOptionLabels('reviewers.0.phaseId'))
            .toEqual([
                'Screening',
                'Review',
            ])
        expect(getPhaseOptionLabels('reviewers.1.phaseId'))
            .toEqual([
                'Screening',
                'Approval',
            ])
        expect(getPhaseOptionLabels('reviewers.2.phaseId'))
            .toEqual(['Screening'])
    })

    it('clears unmatched scorecard ids instead of surfacing them as fallback options', async () => {
        mockedFetchScorecards.mockResolvedValue([
            {
                id: 'scorecard-review',
                name: 'Review scorecard',
                type: 'Review',
            },
        ])

        render(
            <TestHarness
                defaultValues={{
                    phases: [
                        {
                            id: 'review',
                            name: 'Review',
                            phaseId: 'review',
                        },
                    ],
                    reviewers: [
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'review',
                            roleId: 'role-1',
                            scorecardId: '315HuPeby34i2b',
                        },
                    ],
                }}
                showScorecardValue
            />,
        )

        await waitFor(() => {
            expect(mockedFetchScorecards)
                .toHaveBeenCalled()
        })
        await waitFor(() => {
            expect(screen.getByTestId('scorecard-id-value').textContent)
                .toBe('')
        })

        expect(screen.getByTestId('reviewers.0.scorecardId')
            .getAttribute('data-options'))
            .not.toContain('315HuPeby34i2b')
    })

    it('clears the selected scorecard when the reviewer phase changes', async () => {
        mockedFetchScorecards.mockResolvedValue([
            {
                id: 'scorecard-review',
                name: 'Review scorecard',
                type: 'Review',
            },
            {
                id: 'scorecard-approval',
                name: 'Approval scorecard',
                type: 'Approval',
            },
        ])

        render(
            <TestHarness
                defaultValues={{
                    phases: [
                        {
                            id: 'review',
                            name: 'Review',
                            phaseId: 'review',
                        },
                        {
                            id: 'approval',
                            name: 'Approval',
                            phaseId: 'approval',
                        },
                    ],
                    reviewers: [
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'review',
                            roleId: 'role-1',
                            scorecardId: 'scorecard-review',
                        },
                    ],
                }}
                showScorecardValue
            />,
        )

        await waitFor(() => {
            expect(mockedFetchScorecards)
                .toHaveBeenCalled()
        })

        fireEvent.change(
            within(screen.getByTestId('reviewers.0.phaseId'))
                .getByRole('combobox', { name: 'Phase' }),
            {
                target: {
                    value: 'approval',
                },
            },
        )

        await waitFor(() => {
            expect(screen.getByTestId('scorecard-id-value').textContent)
                .toBe('')
        })
    })

    it('clears a stale scorecard validation error when the selected scorecard is valid', async () => {
        const scorecardsRequest = createDeferredPromise<Array<{
            id: string
            name: string
            phaseId?: string
        }>>()
        mockedFetchScorecards.mockImplementation(() => scorecardsRequest.promise)

        render(
            <TestHarness
                defaultValues={{
                    reviewers: [
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'phase-1',
                            roleId: 'role-1',
                            scorecardId: 'scorecard-1',
                        },
                    ],
                }}
                initialScorecardErrorMessage='Scorecard is required for member reviewer type'
                showScorecardValue
            />,
        )

        await waitFor(() => {
            expect(mockedFetchScorecards)
                .toHaveBeenCalled()
        })
        expect(screen.getByTestId('reviewers.0.scorecardId-error').textContent)
            .toBe('Scorecard is required for member reviewer type')
        expect(screen.getByTestId('scorecard-id-value').textContent)
            .toBe('scorecard-1')

        await act(async () => {
            scorecardsRequest.resolve([
                {
                    id: 'scorecard-1',
                    name: 'Scorecard 1',
                    phaseId: 'phase-1',
                },
            ])
        })

        await waitFor(() => {
            expect(screen.queryByTestId('reviewers.0.scorecardId-error'))
                .toBeNull()
        })
        expect(screen.getByTestId('scorecard-id-value').textContent)
            .toBe('scorecard-1')
    })

    it('clears a stale scorecard validation error when the saved scorecard id casing drifts', async () => {
        const scorecardsRequest = createDeferredPromise<Array<{
            id: string
            name: string
            phaseId?: string
        }>>()
        mockedFetchScorecards.mockImplementation(() => scorecardsRequest.promise)

        render(
            <TestHarness
                defaultValues={{
                    reviewers: [
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'phase-1',
                            roleId: 'role-1',
                            scorecardId: 'Scorecard-1',
                        },
                    ],
                }}
                initialScorecardErrorMessage='Scorecard is required for member reviewer type'
                showScorecardValue
            />,
        )

        await waitFor(() => {
            expect(mockedFetchScorecards)
                .toHaveBeenCalled()
        })

        await act(async () => {
            scorecardsRequest.resolve([
                {
                    id: 'scorecard-1',
                    name: 'Scorecard 1',
                    phaseId: 'phase-1',
                },
            ])
        })

        await waitFor(() => {
            expect(screen.queryByTestId('reviewers.0.scorecardId-error'))
                .toBeNull()
        })
        expect(screen.getByTestId('scorecard-id-value').textContent)
            .toBe('Scorecard-1')
    })
})
