import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import { Button } from '~/libs/ui'

import {
    FormRadioGroup,
    FormRadioOption,
    FormSelectField,
    FormSelectOption,
    FormTextField,
    FormUserAutocomplete,
} from '../../../../../lib/components/form'
import {
    useFetchResourceRoles,
    UseFetchResourceRolesResult,
} from '../../../../../lib/hooks'
import {
    ChallengeEditorFormData,
    DefaultReviewer,
    Reviewer,
    Scorecard,
} from '../../../../../lib/models'
import {
    createResource,
    deleteResource,
    fetchDefaultReviewers,
    fetchScorecards,
} from '../../../../../lib/services'

import styles from './ReviewersField.module.scss'

const reviewerTypeOptions: FormRadioOption<boolean>[] = [
    {
        label: 'Member reviewer',
        value: true,
    },
    {
        label: 'AI reviewer',
        value: false,
    },
]

function toNumber(value: unknown): number {
    const parsed = Number(value)

    return Number.isFinite(parsed)
        ? parsed
        : 0
}

export const ReviewersField: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()

    const {
        resourceRoles,
    }: UseFetchResourceRolesResult = useFetchResourceRoles()

    const [defaultReviewers, setDefaultReviewers] = useState<DefaultReviewer[]>([])
    const [scorecards, setScorecards] = useState<Scorecard[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [loadError, setLoadError] = useState<string | undefined>()

    const challengeId = useWatch({
        control: formContext.control,
        name: 'id',
    }) as string | undefined
    const phases = useWatch({
        control: formContext.control,
        name: 'phases',
    }) as ChallengeEditorFormData['phases']
    const reviewers = useWatch({
        control: formContext.control,
        name: 'reviewers',
    }) as Reviewer[] | undefined
    const trackId = useWatch({
        control: formContext.control,
        name: 'trackId',
    }) as string | undefined
    const typeId = useWatch({
        control: formContext.control,
        name: 'typeId',
    }) as string | undefined

    const reviewerRows = useMemo<Reviewer[]>(
        () => (Array.isArray(reviewers)
            ? reviewers
            : []),
        [reviewers],
    )

    const phaseOptions = useMemo<FormSelectOption[]>(
        () => (Array.isArray(phases)
            ? phases
                .filter(phase => typeof phase.phaseId === 'string' && typeof phase.name === 'string')
                .map(phase => ({
                    label: phase.name as string,
                    value: phase.phaseId as string,
                }))
            : []),
        [phases],
    )

    const roleOptions = useMemo<FormSelectOption[]>(
        () => resourceRoles
            .map(role => ({
                label: role.name,
                value: role.id,
            })),
        [resourceRoles],
    )

    const estimatedReviewerCost = useMemo(
        () => reviewerRows
            .reduce((sum, reviewer) => {
                if (reviewer?.isMemberReview === false) {
                    return sum
                }

                const baseCoefficient = toNumber(reviewer.baseCoefficient)
                const incrementalCoefficient = toNumber(reviewer.incrementalCoefficient)
                const reviewerCount = Math.max(1, Math.trunc(toNumber(reviewer.memberReviewerCount) || 1))

                return sum + baseCoefficient + (incrementalCoefficient * Math.max(0, reviewerCount - 1))
            }, 0),
        [reviewerRows],
    )

    useEffect(() => {
        let mounted = true

        setIsLoading(true)
        setLoadError(undefined)

        fetchScorecards({
            page: 1,
            perPage: 200,
        })
            .then(fetchedScorecards => {
                if (!mounted) {
                    return
                }

                setScorecards(fetchedScorecards)
            })
            .catch((error: unknown) => {
                if (!mounted) {
                    return
                }

                setLoadError(error instanceof Error
                    ? error.message
                    : 'Failed to load reviewer metadata')
            })
            .finally(() => {
                if (mounted) {
                    setIsLoading(false)
                }
            })

        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        const normalizedTypeId = typeId?.trim() || ''
        const normalizedTrackId = trackId?.trim() || ''

        if (!normalizedTypeId || !normalizedTrackId) {
            setDefaultReviewers([])
            return undefined
        }

        let mounted = true

        fetchDefaultReviewers(normalizedTypeId, normalizedTrackId)
            .then(fetchedDefaultReviewers => {
                if (!mounted) {
                    return
                }

                setDefaultReviewers(fetchedDefaultReviewers)
            })
            .catch(() => {
                if (mounted) {
                    setDefaultReviewers([])
                }
            })

        return () => {
            mounted = false
        }
    }, [trackId, typeId])

    const sanitizeDecimalValue = useCallback(
        (value: string): string => value.replace(/[^\d.]/g, ''),
        [],
    )

    const sanitizeIntegerValue = useCallback(
        (value: string): string => value.replace(/[^\d]/g, ''),
        [],
    )

    const applyDefaultReviewers = useCallback((): void => {
        if (!defaultReviewers.length) {
            return
        }

        formContext.setValue('reviewers', [
            ...reviewerRows,
            ...defaultReviewers.map(defaultReviewer => ({
                baseCoefficient: 0,
                incrementalCoefficient: 0,
                isMemberReview: true,
                memberReviewerCount: 1,
                phaseId: defaultReviewer.phaseId,
                roleId: defaultReviewer.roleId,
            })),
        ], {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [
        defaultReviewers,
        formContext,
        reviewerRows,
    ])

    const addReviewer = useCallback((): void => {
        formContext.setValue('reviewers', [
            ...reviewerRows,
            {
                baseCoefficient: 0,
                incrementalCoefficient: 0,
                isMemberReview: true,
                memberReviewerCount: 1,
            },
        ], {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [
        formContext,
        reviewerRows,
    ])

    const persistReviewerAsResource = useCallback(
        async (reviewerIndex: number): Promise<void> => {
            const reviewer = reviewerRows[reviewerIndex]
            const normalizedChallengeId = challengeId?.trim() || ''

            if (!reviewer || !reviewer.memberId || !reviewer.roleId || !normalizedChallengeId) {
                return
            }

            await createResource({
                challengeId: normalizedChallengeId,
                memberId: reviewer.memberId,
                roleId: reviewer.roleId,
            })
        },
        [
            challengeId,
            reviewerRows,
        ],
    )

    const removeReviewer = useCallback(
        async (reviewerIndex: number): Promise<void> => {
            const reviewer = reviewerRows[reviewerIndex]
            const normalizedChallengeId = challengeId?.trim() || ''

            if (reviewer && reviewer.memberId && reviewer.roleId && normalizedChallengeId) {
                await deleteResource({
                    challengeId: normalizedChallengeId,
                    memberId: reviewer.memberId,
                    roleId: reviewer.roleId,
                })
            }

            formContext.setValue('reviewers', reviewerRows
                .filter((_, index) => index !== reviewerIndex), {
                shouldDirty: true,
                shouldValidate: true,
            })
        },
        [
            challengeId,
            formContext,
            reviewerRows,
        ],
    )

    const getPersistReviewerAsResourceHandler = useCallback(
        (reviewerIndex: number): (() => void) => () => {
            persistReviewerAsResource(reviewerIndex)
                .catch(() => undefined)
        },
        [persistReviewerAsResource],
    )

    const getRemoveReviewerHandler = useCallback(
        (reviewerIndex: number): (() => void) => () => {
            removeReviewer(reviewerIndex)
                .catch(() => undefined)
        },
        [removeReviewer],
    )

    return (
        <div className={styles.container}>
            <div className={styles.summary}>
                <div>
                    Reviewer rows:
                    {' '}
                    {reviewerRows.length}
                </div>
                <div>
                    Scorecards loaded:
                    {' '}
                    {scorecards.length}
                </div>
                <div>
                    Estimated reviewer cost: $
                    {' '}
                    {estimatedReviewerCost.toLocaleString()}
                </div>
                {loadError
                    ? <div className={styles.error}>{loadError}</div>
                    : undefined}
            </div>

            <div className={styles.actions}>
                <Button
                    disabled={isLoading}
                    label='Add reviewer'
                    onClick={addReviewer}
                    secondary
                />
                <Button
                    disabled={!defaultReviewers.length}
                    label='Apply default reviewers'
                    onClick={applyDefaultReviewers}
                    secondary
                />
            </div>

            <div className={styles.rows}>
                {reviewerRows.map((reviewer, index) => {
                    const isMemberReview = reviewer?.isMemberReview !== false
                    const reviewerPrefix = `reviewers.${index}`

                    return (
                        <div
                            className={styles.row}
                            key={`${reviewerPrefix}-${reviewer.memberId || reviewer.phaseId || index}`}
                        >
                            <div className={styles.grid}>
                                <FormSelectField
                                    label='Phase'
                                    name={`${reviewerPrefix}.phaseId`}
                                    options={phaseOptions}
                                    placeholder='Select phase'
                                />
                                <FormSelectField
                                    label='Role'
                                    name={`${reviewerPrefix}.roleId`}
                                    options={roleOptions}
                                    placeholder='Select role'
                                />
                                <FormRadioGroup
                                    label='Reviewer Type'
                                    name={`${reviewerPrefix}.isMemberReview`}
                                    options={reviewerTypeOptions}
                                />
                                {isMemberReview
                                    ? (
                                        <FormUserAutocomplete
                                            label='Member'
                                            name={`${reviewerPrefix}.memberId`}
                                            placeholder='Search member'
                                            valueField='userId'
                                        />
                                    )
                                    : (
                                        <FormTextField
                                            label='AI Workflow ID'
                                            name={`${reviewerPrefix}.aiWorkflowId`}
                                            placeholder='Enter AI workflow ID'
                                        />
                                    )}
                                <FormTextField
                                    label='Base Coefficient'
                                    name={`${reviewerPrefix}.baseCoefficient`}
                                    sanitize={sanitizeDecimalValue}
                                    type='number'
                                />
                                <FormTextField
                                    label='Incremental Coefficient'
                                    name={`${reviewerPrefix}.incrementalCoefficient`}
                                    sanitize={sanitizeDecimalValue}
                                    type='number'
                                />
                                {isMemberReview
                                    ? (
                                        <FormTextField
                                            label='Reviewer Count'
                                            name={`${reviewerPrefix}.memberReviewerCount`}
                                            sanitize={sanitizeIntegerValue}
                                            type='number'
                                        />
                                    )
                                    : undefined}
                            </div>

                            <div className={styles.rowActions}>
                                <Button
                                    disabled={!challengeId || !isMemberReview}
                                    label='Save resource'
                                    onClick={getPersistReviewerAsResourceHandler(index)}
                                    secondary
                                />
                                <Button
                                    label='Remove reviewer'
                                    onClick={getRemoveReviewerHandler(index)}
                                    secondary
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ReviewersField
