/**
 * Scorecard Details.
 */
import {
    Dispatch,
    ElementType,
    FC,
    Fragment,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { useSWRConfig } from 'swr'
import { NavLink } from 'react-router-dom'
import { filter, forEach, isEmpty, kebabCase, reduce } from 'lodash'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'
import { TableLoading } from '~/apps/admin/src/lib'

import { useAppNavigate } from '../../hooks'
import {
    AppealInfo,
    ChallengeDetailContextModel,
    FormReviews,
    MappingAppeal,
    ReviewInfo,
    ReviewItemInfo,
    ScorecardInfo,
} from '../../models'
import { ScorecardDetailsHeader } from '../ScorecardDetailsHeader'
import { ScorecardQuestionEdit } from '../ScorecardQuestionEdit'
import { ScorecardQuestionView } from '../ScorecardQuestionView'
import { formReviewsSchema, roundWith2DecimalPlaces } from '../../utils'
import { ConfirmModal } from '../ConfirmModal'
import { IconError } from '../../assets/icons'
import { ReviewItemComment } from '../../models/ReviewItemComment.model'
import { ChallengeDetailContext } from '../../contexts'
import {
    activeReviewAssigmentsRouteId,
    rootRoute,
} from '../../../config/routes.config'

import styles from './ScorecardDetails.module.scss'

interface Props {
    className?: string
    isEdit: boolean
    isManagerEdit?: boolean
    onCancelEdit: () => void
    setIsChanged: Dispatch<SetStateAction<boolean>>
    scorecardInfo?: ScorecardInfo
    isLoading: boolean
    reviewInfo?: ReviewInfo
    isSavingReview: boolean
    isSavingAppeal: boolean
    isSavingAppealResponse: boolean
    isSavingManagerComment: boolean
    saveReviewInfo: (
        updatedReview: FormReviews | undefined,
        fullReview: FormReviews | undefined,
        committed: boolean,
        totalScore: number,
        success: () => void,
    ) => void
    mappingAppeals: MappingAppeal
    addAppeal: (
        content: string,
        commentItem: ReviewItemComment,
        success: () => void,
    ) => void
    doDeleteAppeal: (
        appealInfo: AppealInfo | undefined,
        success: () => void,
    ) => void
    addAppealResponse: (
        content: string,
        updatedResponse: string,
        appeal: AppealInfo,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
    addManagerComment: (
        content: string,
        updatedResponse: string,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
}

export const ScorecardDetails: FC<Props> = (props: Props) => {
    const className = props.className
    const isEdit = props.isEdit
    const isManagerEdit = props.isManagerEdit ?? false
    const onCancelEdit = props.onCancelEdit
    const setIsChanged = props.setIsChanged
    const scorecardInfo = props.scorecardInfo
    const isLoading = props.isLoading
    const reviewInfo = props.reviewInfo
    const isSavingReview = props.isSavingReview
    const isSavingAppeal = props.isSavingAppeal
    const isSavingAppealResponse = props.isSavingAppealResponse
    const isSavingManagerComment = props.isSavingManagerComment
    const saveReviewInfo = props.saveReviewInfo
    const mappingAppeals = props.mappingAppeals
    const addAppeal = props.addAppeal
    const doDeleteAppeal = props.doDeleteAppeal
    const addAppealResponse = props.addAppealResponse
    const addManagerComment = props.addManagerComment
    const navigate = useAppNavigate()
    const { challengeId, challengeInfo }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const { mutate }: { mutate: (key: any, data?: any, opts?: any) => Promise<any> } = useSWRConfig()
    const [isExpand, setIsExpand] = useState<{ [key: string]: boolean }>({})
    const [isShowSaveAsDraftModal, setIsShowSaveAsDraftModal] = useState(false)
    const mappingReviewInfo = useMemo<{
        [key: string]: {
            item: ReviewItemInfo
            index: number
        }
    }>(() => {
        const result: {
            [key: string]: {
                item: ReviewItemInfo
                index: number
            }
        } = {}
        forEach(reviewInfo?.reviewItems ?? [], (item, index) => {
            result[item.scorecardQuestionId] = {
                index,
                item,
            }
        })
        return result
    }, [reviewInfo])
    const [isTouched, setIsTouched] = useState<{ [key: string]: boolean }>({})

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
        getValues,
        trigger,
    }: UseFormReturn<FormReviews> = useForm({
        defaultValues: {
            reviews: [],
        },
        mode: 'onChange',
        resolver: yupResolver(formReviewsSchema),
    })

    const changeHandle = setIsChanged
    useEffect(() => {
        changeHandle(isDirty)
    }, [isDirty, changeHandle])

    const errorMessageTop
        = isEmpty(errors) || isEmpty(isTouched)
            ? ''
            : 'There were validation errors. Check below.'

    const errorMessageBottom
        = isEmpty(errors) || isEmpty(isTouched)
            ? ''
            : 'There were validation errors. Check above.'

    const touchedAllField = useCallback(() => {
        const formData = getValues()
        const isTouchedAll: { [key: string]: boolean } = {}
        forEach(formData.reviews, review => {
            isTouchedAll[`reviews.${review.index}.initialAnswer.message`] = true
            forEach(review.comments, comment => {
                isTouchedAll[
                    `reviews.${review.index}.comments.${comment.index}.content`
                ] = true
            })
        })
        setIsTouched(isTouchedAll)
    }, [getValues])

    const ContainerTag = useMemo<ElementType>(
        () => (isEdit ? 'form' : 'div'),
        [isEdit],
    )

    const [reviewProgress, setReviewProgress] = useState(0)
    const [totalScore, setTotalScore] = useState(0)
    const displayedTotalScore = useMemo(() => {
        const maybeFinalScore = reviewInfo?.finalScore
        if (
            !isEdit
            && typeof maybeFinalScore === 'number'
            && Number.isFinite(maybeFinalScore)
        ) {
            return roundWith2DecimalPlaces(maybeFinalScore)
        }

        return totalScore
    }, [isEdit, reviewInfo?.finalScore, totalScore])

    const onSubmit = useCallback((data: FormReviews) => {
        saveReviewInfo(
            isDirty ? getValues() : undefined,
            getValues(),
            true,
            totalScore,
            async () => {
                reset(data)
                if (challengeId) {
                    const challengeDetailsRoute
                        = `${rootRoute}/${activeReviewAssigmentsRouteId}/${challengeId}/challenge-details`

                    // Proactively revalidate any cached review lists for this challenge
                    // so the score/status reflect immediately on return.
                    try {
                        await mutate(
                            (key: unknown) => (
                                typeof key === 'string'
                                && key.startsWith(`reviewBaseUrl/reviews/${challengeId}/`)
                            ),
                        )
                        // Also refresh the submissions list cache so any
                        // reviewResourceMapping/states used as fallbacks are up-to-date.
                        await mutate(`reviewBaseUrl/submissions/${challengeId}`)
                    } catch {}

                    const tabFromPhase = computeTabFromPhase(
                        (challengeInfo?.phases || []) as Array<{
                            id?: string
                            name?: string
                            scheduledStartDate?: string
                            actualStartDate?: string
                        }>,
                        reviewInfo?.phaseId,
                        challengeInfo?.type?.name,
                        challengeInfo?.type?.abbreviation,
                    )
                    const hasIterativePhase = (challengeInfo?.phases || [])
                        .some(p => (p?.name || '').toString()
                            .toLowerCase()
                            .startsWith('iterative review'))
                    const tabSlug = tabFromPhase || (hasIterativePhase ? 'iterative-review' : 'review-appeals')
                    navigate(`${challengeDetailsRoute}?tab=${tabSlug}`)
                }
            },
        )
    }, [
        challengeId,
        challengeInfo?.phases,
        challengeInfo?.type?.abbreviation,
        challengeInfo?.type?.name,
        getValues,
        isDirty,
        navigate,
        mutate,
        reset,
        saveReviewInfo,
        reviewInfo?.phaseId,
        totalScore,
    ])

    const recalculateReviewProgress = useCallback(() => {
        const reviewFormDatas = getValues().reviews
        const mapingResult: {
            [scorecardQuestionId: string]: string
        } = {}
        const newReviewProgress
            = reviewFormDatas.length > 0
                ? Math.round(
                    (filter(reviewFormDatas, review => {
                        mapingResult[review.scorecardQuestionId]
                            = review.initialAnswer
                        return !!review.initialAnswer
                    }).length
                    * 100)
                    / reviewFormDatas.length,
                )
                : 0
        setReviewProgress(newReviewProgress)

        const groupsScore = reduce(
            scorecardInfo?.scorecardGroups ?? [],
            (groupResult, group) => {
                const groupPoint
                    = (reduce(
                        group.sections ?? [],
                        (sectionResult, section) => {
                            const sectionPoint
                                = (reduce(
                                    section.questions ?? [],
                                    (questionResult, question) => {
                                        let questionPoint = 0
                                        const initialAnswer
                                            = mapingResult[question.id as string]
                                        if (
                                            question.type === 'YES_NO'
                                            && initialAnswer === 'Yes'
                                        ) {
                                            questionPoint = 100
                                        } else if (
                                            question.type === 'SCALE'
                                            && !!initialAnswer
                                        ) {
                                            const totalPoint
                                                = question.scaleMax
                                                - question.scaleMin
                                            const initialAnswerNumber
                                                = parseInt(initialAnswer, 10)
                                                - question.scaleMin
                                            questionPoint
                                                = totalPoint > 0
                                                    ? (initialAnswerNumber
                                                        * 100)
                                                        / totalPoint
                                                    : 0
                                        }

                                        return (
                                            questionResult
                                                + (questionPoint * question.weight)
                                                / 100
                                        )
                                    },
                                    0,
                                )
                                * section.weight)
                                / 100
                            return sectionResult + sectionPoint
                        },
                        0,
                    )
                    * group.weight) / 100
                return groupResult + groupPoint
            },
            0,
        )
        setTotalScore(roundWith2DecimalPlaces(groupsScore))
    }, [getValues, scorecardInfo])

    useEffect(() => {
        if (reviewInfo) {
            const newFormData = {
                reviews: reviewInfo.reviewItems.map(
                    (reviewItem, reviewItemIndex) => ({
                        comments: reviewItem.reviewItemComments.map(
                            (commentItem, commentIndex) => ({
                                content: commentItem.content ?? '',
                                id: commentItem.id,
                                index: commentIndex,
                                type: commentItem.type ?? '',
                            }),
                        ),
                        id: reviewItem.id,
                        index: reviewItemIndex,
                        initialAnswer: reviewItem.finalAnswer || reviewItem.initialAnswer,
                        scorecardQuestionId: reviewItem.scorecardQuestionId,
                    }),
                ),
            }
            reset(newFormData)
            recalculateReviewProgress()
        }
    }, [reviewInfo, recalculateReviewProgress, reset])

    const expandAll = useCallback(() => {
        setIsExpand(
            reduce(
                reviewInfo?.reviewItems ?? [],
                (result, reviewItem) => ({ ...result, [reviewItem.id]: true }),
                {},
            ),
        )
    }, [reviewInfo])

    const back = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        try {
            if (challengeId) {
                // Ensure the challenge details reflect the latest data (e.g., active phase)
                await mutate(`challengeBaseUrl/challenges/${challengeId}`)
            }
        } catch {
            // no-op: navigation should still occur even if revalidation fails
        }

        navigate(-1, {
            fallback: './../../../../challenge-details',
        })
    }, [challengeId, mutate, navigate])

    const closeHandel = useCallback(() => {
        setIsShowSaveAsDraftModal(false)
    }, [])

    return isLoading ? (<TableLoading />) : (
        <div className={classNames(styles.container, className)}>
            <ScorecardDetailsHeader
                isEdit={isEdit}
                scorecardInfo={scorecardInfo}
                reviewProgress={reviewProgress}
                expandAll={expandAll}
                collapseAll={function collapseAll() {
                    setIsExpand({})
                }}
                totalScore={displayedTotalScore}
            />
            {errorMessageTop && (
                <div
                    className={classNames(styles.textErrorTop, {
                        [styles.isEmpty]: !errorMessageTop,
                    })}
                >
                    <i>
                        <IconError />
                    </i>
                    {errorMessageTop}
                </div>
            )}

            {reviewInfo && (
                <ContainerTag
                    className={styles.blockForm}
                    onSubmit={isEdit ? handleSubmit(onSubmit) : undefined}
                >
                    <table className={styles.blockTable}>
                        <tbody>
                            {(scorecardInfo?.scorecardGroups || []).map(
                                (group, groupIndex) => (
                                    <Fragment key={group.id}>
                                        <tr className={styles.blockRowGroup}>
                                            <td colSpan={3}>
                                                {`${groupIndex + 1}. ${group.name} (${group.weight.toFixed(1)})`}
                                            </td>
                                        </tr>

                                        {group.sections.map(
                                            (section, sectionIndex) => (
                                                <Fragment key={section.id}>
                                                    <tr
                                                        className={classNames(
                                                            styles.blockRowSection,
                                                            'question',
                                                        )}
                                                    >
                                                        <td>
                                                            {`${section.name} (${section.weight.toFixed(1)})`}
                                                        </td>
                                                        <td>Weight</td>
                                                        <td>Response</td>
                                                    </tr>
                                                    {section.questions.map(
                                                        (
                                                            question,
                                                            questionIndex,
                                                        ) => {
                                                            const reviewItemInfo
                                                                = mappingReviewInfo[
                                                                    question.id as string
                                                                ]
                                                            if (
                                                                !reviewItemInfo
                                                            ) {
                                                                return undefined
                                                            }

                                                            return isEdit ? (
                                                                <ScorecardQuestionEdit
                                                                    isExpand={
                                                                        isExpand
                                                                    }
                                                                    setIsExpand={
                                                                        setIsExpand
                                                                    }
                                                                    recalculateReviewProgress={
                                                                        recalculateReviewProgress
                                                                    }
                                                                    key={
                                                                        question.id
                                                                    }
                                                                    scorecardQuestion={
                                                                        question
                                                                    }
                                                                    trigger={
                                                                        trigger
                                                                    }
                                                                    reviewItem={
                                                                        reviewItemInfo.item
                                                                    }
                                                                    groupIndex={
                                                                        groupIndex
                                                                    }
                                                                    sectionIndex={
                                                                        sectionIndex
                                                                    }
                                                                    questionIndex={
                                                                        questionIndex
                                                                    }
                                                                    fieldIndex={
                                                                        reviewItemInfo.index
                                                                    }
                                                                    control={
                                                                        control
                                                                    }
                                                                    errors={
                                                                        errors
                                                                    }
                                                                    isTouched={
                                                                        isTouched
                                                                    }
                                                                    setIsTouched={
                                                                        setIsTouched
                                                                    }
                                                                    disabled={isSavingReview}
                                                                />
                                                            ) : (
                                                                <ScorecardQuestionView
                                                                    isExpand={
                                                                        isExpand
                                                                    }
                                                                    setIsExpand={
                                                                        setIsExpand
                                                                    }
                                                                    key={
                                                                        question.id
                                                                    }
                                                                    scorecardQuestion={
                                                                        question
                                                                    }
                                                                    reviewItem={
                                                                        reviewItemInfo.item
                                                                    }
                                                                    reviewInfo={
                                                                        reviewInfo
                                                                    }
                                                                    groupIndex={
                                                                        groupIndex
                                                                    }
                                                                    sectionIndex={
                                                                        sectionIndex
                                                                    }
                                                                    questionIndex={
                                                                        questionIndex
                                                                    }
                                                                    mappingAppeals={
                                                                        mappingAppeals
                                                                    }
                                                                    isSavingAppeal={
                                                                        isSavingAppeal
                                                                    }
                                                                    isSavingAppealResponse={
                                                                        isSavingAppealResponse
                                                                    }
                                                                    isSavingManagerComment={
                                                                        isSavingManagerComment
                                                                    }
                                                                    addAppeal={
                                                                        addAppeal
                                                                    }
                                                                    doDeleteAppeal={
                                                                        doDeleteAppeal
                                                                    }
                                                                    addAppealResponse={
                                                                        addAppealResponse
                                                                    }
                                                                    addManagerComment={
                                                                        addManagerComment
                                                                    }
                                                                    isManagerEdit={
                                                                        isManagerEdit
                                                                    }
                                                                />
                                                            )
                                                        },
                                                    )}
                                                </Fragment>
                                            ),
                                        )}
                                    </Fragment>
                                ),
                            )}
                        </tbody>
                    </table>

                    {isEdit ? (
                        <div className={styles.blockBottomEdit}>
                            <div>
                                {errorMessageBottom && (
                                    <div className={styles.textErrorBottom}>
                                        <i>
                                            <IconError />
                                        </i>
                                        {errorMessageBottom}
                                    </div>
                                )}
                            </div>

                            <div className={styles.blockBtns}>
                                <button
                                    type='button'
                                    className='cancelButton'
                                    onClick={onCancelEdit}
                                >
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    className='borderButton'
                                    onClick={function onClick() {
                                        saveReviewInfo(
                                            isDirty ? getValues() : undefined,
                                            getValues(),
                                            false,
                                            totalScore,
                                            () => {
                                                setIsShowSaveAsDraftModal(true)
                                                reset(getValues())
                                            },
                                        )
                                    }}
                                    disabled={isSavingReview}
                                >
                                    Save as Draft
                                </button>
                                <button
                                    type='submit'
                                    className='filledButton'
                                    onClick={function onClick() {
                                        touchedAllField()
                                    }}
                                    disabled={isSavingReview}
                                >
                                    Mark as Complete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.blockBottomView}>
                            <div className={styles.textTotalScore}>
                                <span>Total Score:</span>
                                <span>{displayedTotalScore}</span>
                            </div>
                            <div className={styles.buttons}>
                                <NavLink
                                    className='filledButton'
                                    to=''
                                    onClick={back}
                                >
                                    Back to Challenge
                                </NavLink>
                            </div>
                        </div>
                    )}
                </ContainerTag>
            )}
            <ConfirmModal
                title='Save as Draft'
                open={isShowSaveAsDraftModal}
                onConfirm={closeHandel}
                onClose={closeHandel}
                action='OK'
                withoutCancel
            >
                <div>Your draft has been successfully saved!</div>
            </ConfirmModal>
        </div>
    )
}

export default ScorecardDetails

// Helpers extracted to tame complexity and satisfy lint rules
function normString(s?: string): string {
    return (s || '').trim()
        .toLowerCase()
}

function isExactRegistration(name?: string): boolean {
    return normString(name) === 'registration'
}

function isExactSubmission(name?: string): boolean {
    return normString(name) === 'submission'
}

function isIterativeReview(name?: string): boolean {
    return normString(name)
        .includes('iterative review')
}

function sortPhasesForDetails(
    phases: Array<{
        id?: string
        name?: string
        scheduledStartDate?: string
        actualStartDate?: string
    }>,
    typeName?: string,
    typeAbbrev?: string,
): Array<{
    id?: string
    name?: string
    scheduledStartDate?: string
    actualStartDate?: string
}> {
    let sorted = [...phases].sort((a, b) => {
        const aStart = new Date(a.actualStartDate || a.scheduledStartDate || '')
            .getTime()
        const bStart = new Date(b.actualStartDate || b.scheduledStartDate || '')
            .getTime()
        if (!Number.isNaN(aStart) && !Number.isNaN(bStart)) {
            if (aStart !== bStart) return aStart - bStart
            const aReg = isExactRegistration(a.name)
            const bReg = isExactRegistration(b.name)
            const aSub = isExactSubmission(a.name)
            const bSub = isExactSubmission(b.name)
            if (aReg && bSub) return -1
            if (aSub && bReg) return 1
        }

        return 0
    })

    const tn = typeName?.toLowerCase?.() || ''
    const ta = typeAbbrev?.toLowerCase?.() || ''
    const isF2F = ta === 'f2f' || tn.replace(/\s|-/g, '') === 'first2finish'
    if (isF2F) {
        const iterative = sorted.filter(p => isIterativeReview(p.name))
        if (iterative.length) {
            const remaining = sorted.filter(p => !isIterativeReview(p.name))
            const regIdx = remaining.findIndex(p => isExactRegistration(p.name))
            const subIdx = remaining.findIndex(p => isExactSubmission(p.name))
            const afterIdx = Math.max(regIdx, subIdx)
            if (afterIdx >= 0 && afterIdx < remaining.length) {
                sorted = [
                    ...remaining.slice(0, afterIdx + 1),
                    ...iterative,
                    ...remaining.slice(afterIdx + 1),
                ]
            } else {
                sorted = [...remaining, ...iterative]
            }
        }
    }

    return sorted
}

function computeTabFromPhase(
    phases: Array<{
        id?: string
        name?: string
        scheduledStartDate?: string
        actualStartDate?: string
    }>,
    targetPhaseId?: string,
    typeName?: string,
    typeAbbrev?: string,
): string | undefined {
    if (!phases.length || !targetPhaseId) return undefined

    const sorted = sortPhasesForDetails(phases, typeName, typeAbbrev)

    // Number duplicate labels the same way as ChallengeDetailsPage
    const counts = new Map<string, number>()
    for (const p of sorted) {
        const raw = (p?.name || '').trim()
        if (raw) {
            const n = counts.get(raw) || 0
            counts.set(raw, n + 1)
            const label = n === 0 ? raw : `${raw} ${n + 1}`
            if (p.id === targetPhaseId) {
                // Only return a tab for Iterative Review phases to avoid
                // changing non-iterative redirects.
                if (isIterativeReview(raw)) {
                    return kebabCase(label)
                }

                return undefined
            }
        }
    }

    return undefined
}
