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
    createResource,
    deleteResource,
    fetchDefaultReviewers,
    fetchProfile,
    fetchScorecards,
} from '../../../../../lib/services'
import {
    ChallengeEditorFormData,
    Reviewer,
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
        disabled?: boolean
        label: string
        name: string
        onValueChange?: (value: string) => void
        placeholder?: string
        required?: boolean
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

        function handleChange(event: ChangeEvent<HTMLInputElement>): void {
            props.onValueChange?.(event.target.value)
            controller.field.onChange(event.target.value)
        }

        return (
            <div
                data-required={String(props.required === true)}
                data-testid={props.name}
                data-value={controller.field.value || ''}
            >
                <label htmlFor={props.name}>{props.label}</label>
                <input
                    aria-label={props.label}
                    disabled={props.disabled}
                    id={props.name}
                    onChange={handleChange}
                    placeholder={props.placeholder}
                    value={controller.field.value || ''}
                />
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
const mockedCreateResource = createResource as jest.Mock
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
    restoreStaleScorecardId?: boolean
    showAdditionalMemberIdsValue?: boolean
    showMemberValue?: boolean
    showMemberValueIndex?: number
    showSecondMemberValue?: boolean
    showPublicOpportunityValue?: boolean
    showRoleValue?: boolean
    showRoleValueIndex?: number
    showReviewersValue?: boolean
    showScorecardValue?: boolean
    showScorecardValueIndex?: number
    screenerOnly?: boolean
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

/**
 * Simulates form state briefly reporting the same stale scorecard after cleanup.
 *
 * @returns render-count marker used to detect runaway scorecard cleanup loops.
 * @throws when the regression repeatedly clears and restores the same scorecard id.
 */
const StaleScorecardIdReporter = (): JSX.Element => {
    const formContext = useReactHookFormContext<ChallengeEditorFormData>()
    const renderCountRef = useRef<number>(0)
    const scorecardId = useWatch({
        control: formContext.control,
        name: 'reviewers.0.scorecardId',
    }) as string | undefined

    renderCountRef.current += 1
    if (renderCountRef.current > 20) {
        throw new Error('Scorecard cleanup looped')
    }

    useEffect(() => {
        if (scorecardId !== undefined) {
            return
        }

        formContext.setValue('reviewers.0.scorecardId', 'stale-scorecard', {
            shouldDirty: false,
            shouldValidate: false,
        })
    }, [
        formContext,
        scorecardId,
    ])

    return <div data-testid='stale-scorecard-renders'>{renderCountRef.current}</div>
}

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            ...baseDefaultValues,
            ...props.defaultValues,
        },
    })
    const roleValueIndex = props.showRoleValueIndex ?? 0
    const scorecardValueIndex = props.showScorecardValueIndex ?? 0
    const memberValueIndex = props.showMemberValueIndex ?? 0

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
            <HumanReviewTab screenerOnly={props.screenerOnly} />
            {props.restoreStaleAdditionalMemberIds
                ? <StaleAdditionalMemberIdsReporter />
                : undefined}
            {props.restoreStaleScorecardId
                ? <StaleScorecardIdReporter />
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
                        {String(formMethods.watch(`reviewers.${memberValueIndex}.memberId` as never) || '')}
                    </div>
                )
                : undefined}
            {props.showSecondMemberValue
                ? (
                    <div data-testid='second-member-id-value'>
                        {formMethods.watch('reviewers.1.memberId') || ''}
                    </div>
                )
                : undefined}
            {props.showPublicOpportunityValue
                ? (
                    <div data-testid='public-opportunity-value'>
                        {String(formMethods.watch('reviewers.0.shouldOpenOpportunity'))}
                    </div>
                )
                : undefined}
            {props.showRoleValue
                ? (
                    <div data-testid='role-id-value'>
                        {String(formMethods.watch(`reviewers.${roleValueIndex}.roleId` as never) || '')}
                    </div>
                )
                : undefined}
            {props.showReviewersValue
                ? (
                    <div data-testid='reviewers-value'>
                        {JSON.stringify(formMethods.watch('reviewers'))}
                    </div>
                )
                : undefined}
            {props.showScorecardValue
                ? (
                    <div data-testid='scorecard-id-value'>
                        {String(formMethods.watch(`reviewers.${scorecardValueIndex}.scorecardId` as never) || '')}
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
        mockedCreateResource.mockResolvedValue(undefined)
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

    it('keeps a Reviewer resource on Review when screening phases have no assigned screeners', async () => {
        mockedUseFetchResourceRoles.mockReturnValue({
            resourceRoles: [
                {
                    id: 'role-screener',
                    name: 'Screener',
                },
                {
                    id: 'role-reviewer',
                    name: 'Reviewer',
                },
                {
                    id: 'role-checkpoint-screener',
                    name: 'Checkpoint Screener',
                },
            ],
        })
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            mutate: jest.fn()
                .mockResolvedValue(undefined),
            resources: [
                {
                    memberId: 'member-reviewer',
                    roleId: 'role-reviewer',
                },
            ],
        })

        render(
            <TestHarness
                defaultValues={{
                    phases: [
                        {
                            id: 'screening-instance',
                            name: 'Screening',
                            phaseId: 'phase-screening',
                        },
                        {
                            id: 'checkpoint-screening-instance',
                            name: 'Checkpoint Screening',
                            phaseId: 'phase-checkpoint-screening',
                        },
                        {
                            id: 'review-instance',
                            name: 'Review',
                            phaseId: 'phase-review',
                        },
                    ],
                    reviewers: [
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'phase-screening',
                            shouldOpenOpportunity: false,
                        },
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'phase-checkpoint-screening',
                            shouldOpenOpportunity: false,
                        },
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'phase-review',
                            shouldOpenOpportunity: false,
                        },
                    ],
                }}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('reviewers.0.memberId')
                .getAttribute('data-value'))
                .toBe('')
            expect(screen.getByTestId('reviewers.1.memberId')
                .getAttribute('data-value'))
                .toBe('')
            expect(screen.getByTestId('reviewers.2.memberId')
                .getAttribute('data-value'))
                .toBe('member-reviewer')
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
                    timelineTemplateId: 'timeline-template-1',
                }}
            />,
        )

        await waitFor(() => {
            expect(mockedFetchDefaultReviewers)
                .toHaveBeenCalledWith({
                    timelineTemplateId: 'timeline-template-1',
                    trackId: 'track-1',
                    typeId: 'type-1',
                })
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

    it('disables and clears public review opportunity for design manual reviewers', async () => {
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [
                {
                    id: 'track-1',
                    name: 'Design',
                    track: 'DESIGN',
                },
            ],
        })
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
                showPublicOpportunityValue
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('button', { name: 'Add reviewer' }) as HTMLButtonElement).disabled)
                .toBe(false)
        })

        fireEvent.click(screen.getByRole('button', { name: 'Add reviewer' }))

        const checkbox = await screen.findByRole('checkbox', {
            name: 'Open public review opportunity',
        }) as HTMLInputElement

        expect(checkbox.checked)
            .toBe(false)
        expect(checkbox.disabled)
            .toBe(true)
        await waitFor(() => {
            expect(screen.getByTestId('public-opportunity-value').textContent)
                .toBe('false')
        })
        expect(screen.getByTestId('reviewers.0.memberId'))
            .not.toBeNull()
    })

    it('repairs hidden legacy rows and assigns private reviewers to the copilot', async () => {
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [{
                id: 'track-1',
                name: 'Design',
                track: 'DESIGN',
            }],
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            isLoading: false,
            resourceRoles: [],
        })
        mockedFetchDefaultReviewers.mockImplementation(filters => Promise.resolve(
            filters?.timelineTemplateId === 'two-round-timeline-template-id'
                ? [
                    {
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'checkpoint-review-phase-id',
                        scorecardId: 'checkpoint-review-scorecard-id',
                        shouldOpenOpportunity: false,
                    },
                    {
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'review-phase-id',
                        scorecardId: 'review-scorecard-id',
                        shouldOpenOpportunity: false,
                    },
                    {
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'checkpoint-screening-phase-id',
                        scorecardId: 'checkpoint-screening-scorecard-id',
                        shouldOpenOpportunity: false,
                    },
                    {
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'screening-phase-id',
                        scorecardId: 'screening-scorecard-id',
                        shouldOpenOpportunity: false,
                    },
                    {
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'approval-phase-id',
                        scorecardId: 'approval-scorecard-id',
                        shouldOpenOpportunity: false,
                    },
                ]
                : [],
        ))
        mockedFetchScorecards.mockResolvedValue([
            {
                id: 'checkpoint-review-scorecard-id',
                name: 'Checkpoint Review Scorecard',
                phaseId: 'checkpoint-review-phase-id',
            },
            {
                id: 'review-scorecard-id',
                name: 'Review Scorecard',
                phaseId: 'review-phase-id',
            },
            {
                id: 'checkpoint-screening-scorecard-id',
                name: 'Checkpoint Screening Scorecard',
                phaseId: 'checkpoint-screening-phase-id',
            },
            {
                id: 'screening-scorecard-id',
                name: 'Screening Scorecard',
                phaseId: 'screening-phase-id',
            },
            {
                id: 'approval-scorecard-id',
                name: 'Approval Scorecard',
                phaseId: 'approval-phase-id',
            },
        ])

        render(
            <TestHarness
                defaultValues={{
                    copilot: 'TCConnCopilot',
                    phases: [
                        {
                            name: 'Checkpoint Screening',
                            phaseId: 'checkpoint-screening-phase-id',
                        },
                        {
                            name: 'Checkpoint Review',
                            phaseId: 'checkpoint-review-phase-id',
                        },
                        {
                            name: 'Screening',
                            phaseId: 'screening-phase-id',
                        },
                        {
                            name: 'Review',
                            phaseId: 'review-phase-id',
                        },
                        {
                            name: 'Approval',
                            phaseId: 'approval-phase-id',
                        },
                    ],
                    reviewers: [
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'checkpoint-review-phase-id',
                            scorecardId: 'checkpoint-review-scorecard-id',
                            shouldOpenOpportunity: true,
                        },
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'review-phase-id',
                            scorecardId: 'review-scorecard-id',
                            shouldOpenOpportunity: false,
                        },
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'checkpoint-screening-phase-id',
                            scorecardId: 'checkpoint-screening-scorecard-id',
                            shouldOpenOpportunity: false,
                        },
                        {
                            isMemberReview: true,
                            memberReviewerCount: 2,
                            phaseId: 'approval-phase-id',
                            scorecardId: 'stale-approval-scorecard-id',
                            shouldOpenOpportunity: false,
                        },
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'approval-phase-id',
                            scorecardId: 'another-stale-approval-scorecard-id',
                            shouldOpenOpportunity: true,
                        },
                    ],
                    timelineTemplateId: 'two-round-timeline-template-id',
                }}
                screenerOnly
                showReviewersValue
            />,
        )

        expect(screen.getByLabelText('Screener'))
            .not.toBeNull()
        await waitFor(() => {
            expect(mockedFetchDefaultReviewers)
                .toHaveBeenCalledWith({
                    timelineTemplateId: 'two-round-timeline-template-id',
                    trackId: 'track-1',
                    typeId: 'type-1',
                })
        })
        await waitFor(() => {
            const reconciledReviewers = JSON.parse(
                screen.getByTestId('reviewers-value').textContent || '[]',
            ) as Reviewer[]

            expect(reconciledReviewers)
                .toHaveLength(5)
            expect(reconciledReviewers.map(reviewer => reviewer.phaseId))
                .toEqual([
                    'checkpoint-screening-phase-id',
                    'checkpoint-review-phase-id',
                    'screening-phase-id',
                    'review-phase-id',
                    'approval-phase-id',
                ])
            expect(reconciledReviewers.filter(reviewer => [
                'checkpoint-review-phase-id',
                'review-phase-id',
                'approval-phase-id',
            ].includes(reviewer.phaseId || '')))
                .toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        handle: 'TCConnCopilot',
                        phaseId: 'checkpoint-review-phase-id',
                        scorecardId: 'checkpoint-review-scorecard-id',
                        shouldOpenOpportunity: false,
                    }),
                    expect.objectContaining({
                        handle: 'TCConnCopilot',
                        phaseId: 'review-phase-id',
                        scorecardId: 'review-scorecard-id',
                        shouldOpenOpportunity: false,
                    }),
                    expect.objectContaining({
                        handle: 'TCConnCopilot',
                        phaseId: 'approval-phase-id',
                        scorecardId: 'approval-scorecard-id',
                        shouldOpenOpportunity: false,
                    }),
                ]))
        })
    })

    it('marks Screening and Checkpoint Screening member assignments optional', () => {
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [
                {
                    id: 'track-1',
                    name: 'Design',
                    track: 'DESIGN',
                },
            ],
        })

        render(
            <TestHarness
                defaultValues={{
                    phases: [
                        {
                            name: 'Screening',
                            phaseId: 'screening-phase-id',
                        },
                        {
                            name: 'Checkpoint Screening',
                            phaseId: 'checkpoint-screening-phase-id',
                        },
                        {
                            name: 'Review',
                            phaseId: 'review-phase-id',
                        },
                    ],
                    reviewers: [
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'screening-phase-id',
                            scorecardId: 'screening-scorecard-id',
                            shouldOpenOpportunity: false,
                        },
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'checkpoint-screening-phase-id',
                            scorecardId: 'checkpoint-screening-scorecard-id',
                            shouldOpenOpportunity: false,
                        },
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'review-phase-id',
                            scorecardId: 'review-scorecard-id',
                            shouldOpenOpportunity: false,
                        },
                    ],
                }}
            />,
        )

        expect(screen.getByTestId('reviewers.0.memberId'))
            .toHaveProperty('dataset.required', 'false')
        expect(screen.getByTestId('reviewers.1.memberId'))
            .toHaveProperty('dataset.required', 'false')
        expect(screen.getByTestId('reviewers.2.memberId'))
            .toHaveProperty('dataset.required', 'true')
    })

    it('assigns one simplified screener selection to checkpoint and final screening roles', async () => {
        const mutateResources = jest.fn()
            .mockResolvedValue(undefined)
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [{
                id: 'track-1',
                name: 'Design',
                track: 'DESIGN',
            }],
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            isLoading: false,
            resourceRoles: [
                {
                    id: 'checkpoint-screener-role-id',
                    name: 'Checkpoint Screener',
                },
                {
                    id: 'screener-role-id',
                    name: 'Screener',
                },
            ],
        })
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            mutate: mutateResources,
            resources: [],
        })

        render(
            <TestHarness
                defaultValues={{
                    phases: [
                        {
                            name: 'Checkpoint Screening',
                            phaseId: 'checkpoint-screening-phase-id',
                        },
                        {
                            name: 'Screening',
                            phaseId: 'screening-phase-id',
                        },
                    ],
                    reviewers: [
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'checkpoint-screening-phase-id',
                            scorecardId: 'checkpoint-screening-scorecard-id',
                            shouldOpenOpportunity: false,
                        },
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'screening-phase-id',
                            scorecardId: 'screening-scorecard-id',
                            shouldOpenOpportunity: false,
                        },
                    ],
                }}
                screenerOnly
                showMemberValue
                showMemberValueIndex={0}
                showSecondMemberValue
                showScorecardValue
                showScorecardValueIndex={0}
            />,
        )

        expect(screen.getByLabelText('Screener')
            .getAttribute('placeholder'))
            .toBe('Select user')
        expect(screen.queryByLabelText('Phase'))
            .toBeNull()
        expect(screen.queryByLabelText('Scorecard'))
            .toBeNull()

        fireEvent.change(screen.getByLabelText('Screener'), {
            target: {
                value: 'screener-member-id',
            },
        })

        await waitFor(() => {
            expect(screen.getByTestId('member-id-value').textContent)
                .toBe('screener-member-id')
            expect(screen.getByTestId('second-member-id-value').textContent)
                .toBe('screener-member-id')
            expect((screen.getByLabelText('Screener') as HTMLInputElement).value)
                .toBe('screener-member-id')
            expect(mockedCreateResource.mock.calls)
                .toEqual(expect.arrayContaining([
                    [{
                        challengeId: 'challenge-1',
                        memberId: 'screener-member-id',
                        roleId: 'checkpoint-screener-role-id',
                    }],
                    [{
                        challengeId: 'challenge-1',
                        memberId: 'screener-member-id',
                        roleId: 'screener-role-id',
                    }],
                ]))
        })
        expect(screen.getByTestId('scorecard-id-value').textContent)
            .toBe('checkpoint-screening-scorecard-id')
        expect(mockedCreateResource)
            .toHaveBeenCalledTimes(2)
        expect(mockedDeleteResource)
            .not.toHaveBeenCalled()
        await waitFor(() => {
            expect(mutateResources)
                .toHaveBeenCalled()
        })
    })

    it('disables simplified screener changes while both resource assignments synchronize', async () => {
        const resourceCreateRequest = createDeferredPromise<void>()
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [{
                id: 'track-1',
                name: 'Design',
                track: 'DESIGN',
            }],
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            isLoading: false,
            resourceRoles: [
                {
                    id: 'checkpoint-screener-role-id',
                    name: 'Checkpoint Screener',
                },
                {
                    id: 'screener-role-id',
                    name: 'Screener',
                },
            ],
        })
        mockedUseFetchResources.mockReturnValue({
            isError: false,
            isLoading: false,
            mutate: jest.fn()
                .mockResolvedValue(undefined),
            resources: [],
        })
        mockedCreateResource.mockReturnValue(resourceCreateRequest.promise)

        render(
            <TestHarness
                defaultValues={{
                    phases: [
                        {
                            name: 'Checkpoint Screening',
                            phaseId: 'checkpoint-screening-phase-id',
                        },
                        {
                            name: 'Screening',
                            phaseId: 'screening-phase-id',
                        },
                    ],
                    reviewers: [
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'checkpoint-screening-phase-id',
                        },
                        {
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'screening-phase-id',
                        },
                    ],
                }}
                screenerOnly
            />,
        )

        const screenerField = screen.getByLabelText('Screener') as HTMLInputElement

        fireEvent.change(screenerField, {
            target: {
                value: 'first-member-id',
            },
        })

        await waitFor(() => {
            expect(screenerField.disabled)
                .toBe(true)
        })
        fireEvent.change(screenerField, {
            target: {
                value: 'second-member-id',
            },
        })
        expect(mockedCreateResource)
            .toHaveBeenCalledTimes(2)

        await act(async () => {
            resourceCreateRequest.resolve(undefined)
            await resourceCreateRequest.promise
        })
        await waitFor(() => {
            expect(screenerField.disabled)
                .toBe(false)
        })
    })

    it('disables simplified screener assignment when challenge resources fail to load', () => {
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [{
                id: 'track-1',
                name: 'Design',
                track: 'DESIGN',
            }],
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            isLoading: false,
            resourceRoles: [{
                id: 'screener-role-id',
                name: 'Screener',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            isError: true,
            isLoading: false,
            mutate: jest.fn()
                .mockResolvedValue(undefined),
            resources: [],
        })

        render(
            <TestHarness
                defaultValues={{
                    phases: [{
                        name: 'Screening',
                        phaseId: 'screening-phase-id',
                    }],
                    reviewers: [{
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'screening-phase-id',
                    }],
                }}
                screenerOnly
            />,
        )

        expect((screen.getByLabelText('Screener') as HTMLInputElement).disabled)
            .toBe(true)
        expect(screen.getByText('Unable to load screener assignments.'))
            .not.toBeNull()
    })

    it('replaces existing checkpoint and final screener resources together', async () => {
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [{
                id: 'track-1',
                name: 'Design',
                track: 'DESIGN',
            }],
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            isLoading: false,
            resourceRoles: [
                {
                    id: 'checkpoint-screener-role-id',
                    name: 'Checkpoint Screener',
                },
                {
                    id: 'screener-role-id',
                    name: 'Screener',
                },
            ],
        })
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            mutate: jest.fn()
                .mockResolvedValue(undefined),
            resources: [
                {
                    challengeId: 'challenge-1',
                    memberId: 'old-member-id',
                    roleId: 'checkpoint-screener-role-id',
                    roleName: 'Checkpoint Screener',
                },
                {
                    challengeId: 'challenge-1',
                    memberId: 'old-member-id',
                    roleId: 'screener-role-id',
                    roleName: 'Screener',
                },
            ],
        })

        render(
            <TestHarness
                defaultValues={{
                    phases: [
                        {
                            name: 'Checkpoint Screening',
                            phaseId: 'checkpoint-screening-phase-id',
                        },
                        {
                            name: 'Screening',
                            phaseId: 'screening-phase-id',
                        },
                    ],
                    reviewers: [
                        {
                            isMemberReview: true,
                            memberId: 'old-member-id',
                            memberReviewerCount: 1,
                            phaseId: 'checkpoint-screening-phase-id',
                            scorecardId: 'checkpoint-scorecard-id',
                        },
                        {
                            isMemberReview: true,
                            memberId: 'old-member-id',
                            memberReviewerCount: 1,
                            phaseId: 'screening-phase-id',
                            scorecardId: 'screening-scorecard-id',
                        },
                    ],
                }}
                screenerOnly
            />,
        )

        fireEvent.change(screen.getByLabelText('Screener'), {
            target: {
                value: 'new-member-id',
            },
        })

        await waitFor(() => {
            expect(mockedDeleteResource.mock.calls)
                .toEqual(expect.arrayContaining([
                    [{
                        challengeId: 'challenge-1',
                        memberHandle: undefined,
                        memberId: 'old-member-id',
                        roleId: 'checkpoint-screener-role-id',
                    }],
                    [{
                        challengeId: 'challenge-1',
                        memberHandle: undefined,
                        memberId: 'old-member-id',
                        roleId: 'screener-role-id',
                    }],
                ]))
        })
        expect(mockedCreateResource)
            .toHaveBeenCalledTimes(2)
        expect(mockedDeleteResource)
            .toHaveBeenCalledTimes(2)
    })

    it('clears existing checkpoint and final screener resources together', async () => {
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [{
                id: 'track-1',
                name: 'Design',
                track: 'DESIGN',
            }],
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            isLoading: false,
            resourceRoles: [
                {
                    id: 'checkpoint-screener-role-id',
                    name: 'Checkpoint Screener',
                },
                {
                    id: 'screener-role-id',
                    name: 'Screener',
                },
            ],
        })
        mockedUseFetchResources.mockReturnValue({
            isError: false,
            isLoading: false,
            mutate: jest.fn()
                .mockResolvedValue(undefined),
            resources: [
                {
                    challengeId: 'challenge-1',
                    memberId: 'old-member-id',
                    roleId: 'checkpoint-screener-role-id',
                    roleName: 'Checkpoint Screener',
                },
                {
                    challengeId: 'challenge-1',
                    memberId: 'old-member-id',
                    roleId: 'screener-role-id',
                    roleName: 'Screener',
                },
            ],
        })

        render(
            <TestHarness
                defaultValues={{
                    phases: [
                        {
                            name: 'Checkpoint Screening',
                            phaseId: 'checkpoint-screening-phase-id',
                        },
                        {
                            name: 'Screening',
                            phaseId: 'screening-phase-id',
                        },
                    ],
                    reviewers: [
                        {
                            isMemberReview: true,
                            memberId: 'old-member-id',
                            memberReviewerCount: 1,
                            phaseId: 'checkpoint-screening-phase-id',
                        },
                        {
                            isMemberReview: true,
                            memberId: 'old-member-id',
                            memberReviewerCount: 1,
                            phaseId: 'screening-phase-id',
                        },
                    ],
                }}
                screenerOnly
            />,
        )

        fireEvent.change(screen.getByLabelText('Screener'), {
            target: {
                value: '',
            },
        })

        await waitFor(() => {
            expect(mockedDeleteResource)
                .toHaveBeenCalledTimes(2)
        })
        expect(mockedCreateResource)
            .not.toHaveBeenCalled()
    })

    it('does not duplicate a hydrated handle-only screener resource', async () => {
        const mutateResources = jest.fn()
            .mockResolvedValue(undefined)
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [{
                id: 'track-1',
                name: 'Design',
                track: 'DESIGN',
            }],
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            isLoading: false,
            resourceRoles: [{
                id: 'screener-role-id',
                name: 'Screener',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            isError: false,
            isLoading: false,
            mutate: mutateResources,
            resources: [{
                challengeId: 'challenge-1',
                memberHandle: 'legacy.screener',
                roleId: 'screener-role-id',
                roleName: 'Screener',
            }],
        })
        mockedFetchProfile.mockResolvedValue({
            handle: 'legacy.screener',
            userId: 'legacy-member-id',
        })

        render(
            <TestHarness
                defaultValues={{
                    phases: [{
                        name: 'Screening',
                        phaseId: 'screening-phase-id',
                    }],
                    reviewers: [{
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'screening-phase-id',
                    }],
                }}
                screenerOnly
            />,
        )

        await waitFor(() => {
            expect((screen.getByLabelText('Screener') as HTMLInputElement).value)
                .toBe('legacy-member-id')
            expect((screen.getByLabelText('Screener') as HTMLInputElement).disabled)
                .toBe(false)
        })

        fireEvent.change(screen.getByLabelText('Screener'), {
            target: {
                value: ' legacy-member-id ',
            },
        })

        await waitFor(() => {
            expect(mutateResources)
                .toHaveBeenCalled()
        })
        expect(mockedCreateResource)
            .not.toHaveBeenCalled()
        expect(mockedDeleteResource)
            .not.toHaveBeenCalled()
    })

    it('assigns only the final Screener role for one-round design challenges', async () => {
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [{
                id: 'track-1',
                name: 'Design',
                track: 'DESIGN',
            }],
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            isLoading: false,
            resourceRoles: [{
                id: 'screener-role-id',
                name: 'Screener',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            mutate: jest.fn()
                .mockResolvedValue(undefined),
            resources: [],
        })

        render(
            <TestHarness
                defaultValues={{
                    phases: [{
                        name: 'Screening',
                        phaseId: 'screening-phase-id',
                    }],
                    reviewers: [{
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'screening-phase-id',
                        scorecardId: 'screening-scorecard-id',
                    }],
                }}
                screenerOnly
            />,
        )

        fireEvent.change(screen.getByLabelText('Screener'), {
            target: {
                value: 'screener-member-id',
            },
        })

        await waitFor(() => {
            expect(mockedCreateResource)
                .toHaveBeenCalledWith({
                    challengeId: 'challenge-1',
                    memberId: 'screener-member-id',
                    roleId: 'screener-role-id',
                })
        })
        expect(mockedCreateResource)
            .toHaveBeenCalledTimes(1)
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

    it('adds the next selectable default reviewer phase for one-round design challenges', async () => {
        mockedFetchDefaultReviewers.mockResolvedValue([
            {
                isMemberReview: true,
                memberReviewerCount: 1,
                phaseId: 'checkpoint-review',
                scorecardId: 'checkpoint-review-scorecard',
                shouldOpenOpportunity: true,
            },
            {
                isMemberReview: true,
                memberReviewerCount: 1,
                phaseId: 'screening',
                scorecardId: 'screening-scorecard',
                shouldOpenOpportunity: true,
            },
            {
                isMemberReview: true,
                memberReviewerCount: 1,
                phaseId: 'review',
                scorecardId: 'review-scorecard',
                shouldOpenOpportunity: false,
            },
        ])
        mockedFetchScorecards.mockResolvedValue([
            {
                id: 'screening-scorecard',
                name: 'Screening scorecard',
                phaseId: 'screening',
            },
            {
                id: 'review-scorecard',
                name: 'Review scorecard',
                phaseId: 'review',
            },
        ])

        render(
            <TestHarness
                defaultValues={{
                    phases: [
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
                    ],
                    reviewers: [
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'screening',
                            roleId: 'role-1',
                            scorecardId: 'screening-scorecard',
                            shouldOpenOpportunity: true,
                        },
                    ],
                }}
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('button', { name: 'Add reviewer' }) as HTMLButtonElement).disabled)
                .toBe(false)
        })

        fireEvent.click(screen.getByRole('button', { name: 'Add reviewer' }))

        await waitFor(() => {
            expect(screen.getByTestId('reviewers.1.phaseId')
                .getAttribute('data-value'))
                .toBe('review')
        })
        expect(screen.getByTestId('reviewers.1.scorecardId')
            .getAttribute('data-value'))
            .toBe('review-scorecard')
    })

    it('adds single-round design reviewers on the approval phase when default metadata is stale', async () => {
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [
                {
                    id: 'design-track',
                    name: 'Design',
                    track: 'DESIGN',
                },
            ],
        })
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [
                {
                    id: 'challenge-type',
                    name: 'Challenge',
                },
            ],
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            resourceRoles: [
                {
                    id: 'role-reviewer',
                    name: 'Reviewer',
                },
                {
                    id: 'role-approver',
                    name: 'Approver',
                },
            ],
        })
        mockedFetchDefaultReviewers.mockResolvedValue([
            {
                isMemberReview: true,
                memberReviewerCount: 1,
                phaseId: 'stale-review-phase',
                roleId: 'role-reviewer',
                scorecardId: 'scorecard-approval',
            },
        ])
        mockedFetchScorecards.mockResolvedValue([
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
                            id: 'approval',
                            name: 'Approval',
                            phaseId: 'approval',
                        },
                    ],
                    reviewers: [],
                    trackId: 'design-track',
                    typeId: 'challenge-type',
                }}
                showRoleValue
                showScorecardValue
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('button', { name: 'Add reviewer' }) as HTMLButtonElement).disabled)
                .toBe(false)
        })

        fireEvent.click(screen.getByRole('button', { name: 'Add reviewer' }))

        await waitFor(() => {
            expect(screen.getByTestId('reviewers.0.phaseId')
                .getAttribute('data-value'))
                .toBe('approval')
        })
        expect(screen.getByTestId('role-id-value').textContent)
            .toBe('role-approver')
        expect(screen.getByTestId('scorecard-id-value').textContent)
            .toBe('')
        expect(screen.getByTestId('reviewers.0.scorecardId')
            .getAttribute('data-options'))
            .toContain('Approval scorecard')
    })

    it('adds the missing approval reviewer when design default reviewers fail to load', async () => {
        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [
                {
                    id: 'design-track',
                    name: 'Design',
                    track: 'DESIGN',
                },
            ],
        })
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [
                {
                    id: 'challenge-type',
                    name: 'Challenge',
                },
            ],
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            resourceRoles: [
                {
                    id: 'role-screener',
                    name: 'Screener',
                },
                {
                    id: 'role-reviewer',
                    name: 'Reviewer',
                },
                {
                    id: 'role-approver',
                    name: 'Approver',
                },
            ],
        })
        mockedFetchDefaultReviewers.mockRejectedValue(new Error('Default reviewers unavailable'))
        mockedFetchScorecards.mockResolvedValue([
            {
                id: 'scorecard-screening',
                name: 'Screening scorecard',
                type: 'Screening',
            },
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
                            id: 'submission-row',
                            name: 'Submission',
                            phaseId: 'submission',
                        },
                        {
                            id: 'registration-row',
                            name: 'Registration',
                            phaseId: 'registration',
                        },
                        {
                            id: 'screening-row',
                            name: 'Screening',
                            phaseId: 'screening',
                        },
                        {
                            id: 'review-row',
                            name: 'Review',
                            phaseId: 'review',
                        },
                        {
                            id: 'approval-row',
                            name: 'Approval',
                            phaseId: 'approval',
                        },
                    ],
                    reviewers: [
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'screening',
                            roleId: 'role-screener',
                            scorecardId: 'scorecard-screening',
                        },
                        {
                            additionalMemberIds: [],
                            isMemberReview: true,
                            memberReviewerCount: 1,
                            phaseId: 'review',
                            roleId: 'role-reviewer',
                            scorecardId: 'scorecard-review',
                        },
                    ],
                    trackId: 'design-track',
                    typeId: 'challenge-type',
                }}
                showRoleValue
                showRoleValueIndex={2}
                showScorecardValue
                showScorecardValueIndex={2}
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('button', { name: 'Add reviewer' }) as HTMLButtonElement).disabled)
                .toBe(false)
        })

        fireEvent.click(screen.getByRole('button', { name: 'Add reviewer' }))

        await waitFor(() => {
            expect(screen.getByTestId('reviewers.2.phaseId')
                .getAttribute('data-value'))
                .toBe('approval')
        })
        expect(screen.getByTestId('role-id-value').textContent)
            .toBe('role-approver')
        expect(screen.getByTestId('scorecard-id-value').textContent)
            .toBe('')
        expect(screen.getByTestId('reviewers.2.scorecardId')
            .getAttribute('data-options'))
            .toContain('Approval scorecard')
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

    it('does not loop when stale scorecard cleanup is reported again', async () => {
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
                            scorecardId: 'stale-scorecard',
                        },
                    ],
                }}
                restoreStaleScorecardId
            />,
        )

        await waitFor(() => {
            expect(mockedFetchScorecards)
                .toHaveBeenCalled()
        })
        await waitFor(() => {
            expect(Number(screen.getByTestId('stale-scorecard-renders').textContent))
                .toBeLessThanOrEqual(20)
        })
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
