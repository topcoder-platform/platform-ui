/**
 * Scorecard Question View.
 */
import {
    Dispatch,
    FC,
    Fragment,
    ReactNode,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { includes } from 'lodash'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { useWindowSize, WindowSize } from '~/libs/shared'

import { IconChevronDown } from '../../assets/icons'
import { ReviewAppContext } from '../../contexts'
import { useRole, useRoleProps } from '../../hooks'
import {
    AppealInfo,
    MappingAppeal,
    ReviewAppContextModel,
    ReviewInfo,
    ReviewItemInfo,
    ScorecardQuestion,
    SelectOption,
} from '../../models'
import { ReviewItemComment } from '../../models/ReviewItemComment.model'
import { stringIsNumberic } from '../../utils'
import { Appeal } from '../Appeal'
import { AppealComment } from '../AppealComment'
import { FieldMarkdownEditor } from '../FieldMarkdownEditor'
import { ManagerComment } from '../ManagerComment'
import { MarkdownReview } from '../MarkdownReview'
import {
    ADMIN,
    COPILOT,
    FINISHTAB,
    QUESTION_YES_NO_OPTIONS,
    REVIEWER,
    SUBMITTER,
    TAB,
} from '../../../config/index.config'

import styles from './ScorecardQuestionView.module.scss'

interface Props {
    className?: string
    scorecardQuestion: ScorecardQuestion
    reviewItem: ReviewItemInfo
    reviewInfo?: ReviewInfo
    groupIndex: number
    sectionIndex: number
    questionIndex: number
    mappingAppeals: MappingAppeal
    isExpand: { [key: string]: boolean }
    setIsExpand: Dispatch<
        SetStateAction<{
            [key: string]: boolean
        }>
    >
    isSavingAppeal: boolean
    isSavingAppealResponse: boolean
    isSavingManagerComment: boolean
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
    isManagerEdit?: boolean
}

function getResponseOptions(scorecardQuestion: ScorecardQuestion): SelectOption[] {
    if (scorecardQuestion.type === 'SCALE') {
        const length
            = scorecardQuestion.scaleMax
            - scorecardQuestion.scaleMin
            + 1

        return Array.from({ length }, (_, index) => {
            const value = `${index + scorecardQuestion.scaleMin}`

            return {
                label: value,
                value,
            }
        })
    }

    if (scorecardQuestion.type === 'YES_NO') {
        return QUESTION_YES_NO_OPTIONS
    }

    return []
}

function getFormattedAnswer(reviewItem: ReviewItemInfo): string | undefined {
    const answer = reviewItem.finalAnswer ?? reviewItem.initialAnswer ?? undefined

    if (stringIsNumberic(answer)) {
        return `Rating ${answer}`
    }

    return answer
}

interface CommentRowParams {
    actionChallengeRole?: string
    addAppeal: Props['addAppeal']
    addAppealResponse: Props['addAppealResponse']
    canRespondToAppeal: boolean
    className?: string
    doDeleteAppeal: Props['doDeleteAppeal']
    isManagerRole: boolean
    isMobile: boolean
    isSavingAppeal: boolean
    isSavingAppealResponse: boolean
    isSubmitterRole: boolean
    managerCommentContent?: ReactNode
    mappingAppeals: MappingAppeal
    reviewItem: ReviewItemInfo
    scorecardQuestion: ScorecardQuestion
    shouldRenderManagerCommentRow: boolean
}

function buildCommentRows({
    actionChallengeRole,
    addAppeal,
    addAppealResponse,
    canRespondToAppeal,
    className,
    doDeleteAppeal,
    isManagerRole,
    isMobile,
    isSavingAppeal,
    isSavingAppealResponse,
    isSubmitterRole,
    mappingAppeals,
    managerCommentContent,
    reviewItem,
    scorecardQuestion,
    shouldRenderManagerCommentRow,
}: CommentRowParams): JSX.Element[] {
    const totalComments = reviewItem.reviewItemComments.length

    return reviewItem.reviewItemComments.map((commentItem, index) => {
        const commentAppeal
            = mappingAppeals[commentItem.id]
            ?? commentItem.appeal
        const isLastComment = index === totalComments - 1
        const shouldShowManagerRowHere
            = isLastComment && shouldRenderManagerCommentRow
        const shouldMarkManagerRowAsLast
            = shouldShowManagerRowHere && !isSubmitterRole

        return (
            <Fragment key={commentItem.sortOrder}>
                {renderResponseCommentRow({
                    className,
                    commentItem,
                    index,
                    isMobile,
                    totalComments,
                })}
                {renderAppealCommentRow({
                    actionChallengeRole,
                    addAppealResponse,
                    canRespondToAppeal,
                    className,
                    commentAppeal,
                    index,
                    isManagerRole,
                    isSavingAppealResponse,
                    reviewItem,
                    scorecardQuestion,
                    totalComments,
                })}
                {renderManagerCommentRow({
                    className,
                    managerCommentContent,
                    shouldMarkManagerRowAsLast,
                    shouldShowManagerRowHere,
                })}
                {renderSubmitterAppealRow({
                    actionChallengeRole,
                    addAppeal,
                    className,
                    commentAppeal,
                    commentItem,
                    doDeleteAppeal,
                    index,
                    isSavingAppeal,
                    totalComments,
                })}
            </Fragment>
        )
    })
}

interface ManagerCommentContentParams {
    existingManagerComment: string
    handleCancelManagerEdit: () => void
    handleSubmitManagerComment: () => void
    hasManagerComment: boolean
    isSavingManagerComment: boolean
    isSubmitDisabled: boolean
    managerCommentDraft: string
    reviewItemId: ReviewItemInfo['id']
    selectedScore: string
    setManagerCommentDraft: Dispatch<SetStateAction<string>>
    showManagerCommentEditor: boolean
}

function buildManagerCommentContent({
    existingManagerComment,
    handleCancelManagerEdit,
    handleSubmitManagerComment,
    hasManagerComment,
    isSavingManagerComment,
    isSubmitDisabled,
    managerCommentDraft,
    reviewItemId,
    selectedScore,
    setManagerCommentDraft,
    showManagerCommentEditor,
}: ManagerCommentContentParams): ReactNode | undefined {
    if (showManagerCommentEditor) {
        return (
            <div className={styles.managerCommentEditor}>
                <label className={styles.managerCommentTitle}>Manager Comment</label>
                <FieldMarkdownEditor
                    key={`${reviewItemId}-${selectedScore}`}
                    className={styles.managerCommentEditorInput}
                    initialValue={managerCommentDraft || existingManagerComment}
                    onChange={setManagerCommentDraft}
                    showBorder
                    disabled={isSavingManagerComment}
                    uploadCategory='manager-comment'
                />
                <div className={styles.managerCommentActions}>
                    <button
                        type='button'
                        className='filledButton'
                        onClick={handleSubmitManagerComment}
                        disabled={isSubmitDisabled}
                    >
                        Submit Manager Comment
                    </button>
                    <button
                        type='button'
                        className='borderButton'
                        onClick={handleCancelManagerEdit}
                        disabled={isSavingManagerComment}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )
    }

    if (hasManagerComment) {
        return (
            <div className={styles.managerCommentDisplay}>
                <span className={styles.managerCommentTitle}>Manager Comment</span>
                <MarkdownReview
                    value={existingManagerComment}
                    className={styles.managerCommentMarkdown}
                />
            </div>
        )
    }

    return undefined
}

interface GuidelinesRowParams {
    className?: string
    isExpanded: boolean
    scorecardQuestion: ScorecardQuestion
}

function buildGuidelinesRow({
    className,
    isExpanded,
    scorecardQuestion,
}: GuidelinesRowParams): JSX.Element | undefined {
    if (!isExpanded) {
        return undefined
    }

    return (
        <tr
            className={classNames(
                styles.container,
                className,
                styles.blockRowGuidelines,
            )}
        >
            <td colSpan={3}>
                <MarkdownReview
                    value={scorecardQuestion.guidelines}
                    className={styles.textGuidelines}
                />
            </td>
        </tr>
    )
}

interface ManagerCommentRowParams {
    addManagerComment: Props['addManagerComment']
    className?: string
    isManagerRole: boolean
    isSavingManagerComment: boolean
    reviewInfo?: ReviewInfo
    reviewItem: ReviewItemInfo
    scorecardQuestion: ScorecardQuestion
}

function buildManagerCommentRow({
    addManagerComment,
    className,
    isManagerRole,
    isSavingManagerComment,
    reviewInfo,
    reviewItem,
    scorecardQuestion,
}: ManagerCommentRowParams): JSX.Element | undefined {
    if (!isManagerRole || reviewInfo?.id) {
        return undefined
    }

    return (
        <tr
            className={classNames(
                styles.container,
                className,
                styles.blockRowManagerComment,
                styles.isLast,
            )}
        >
            <td colSpan={3}>
                <ManagerComment
                    scorecardQuestion={scorecardQuestion}
                    reviewItem={reviewItem}
                    isSavingManagerComment={isSavingManagerComment}
                    addManagerComment={addManagerComment}
                />
            </td>
        </tr>
    )
}

function renderResponseCommentRow({
    className,
    commentItem,
    index,
    isMobile,
    totalComments,
}: {
    className?: string
    commentItem: ReviewItemComment
    index: number
    isMobile: boolean
    totalComments: number
}): JSX.Element {
    return (
        <tr
            className={classNames(
                styles.container,
                className,
                styles.blockRowResponseComment,
                {
                    [styles.isLast]: index === totalComments - 1,
                },
            )}
        >
            <td colSpan={isMobile ? 3 : 2}>
                <div className={styles.blockResponseComment}>
                    <span className={styles.textResponse}>
                        {`Response ${index + 1}:`}
                    </span>
                    <div className={styles.blockCommentContent}>
                        <span className={styles.textType}>
                            {commentItem.typeDisplay}
                        </span>

                        <MarkdownReview
                            value={commentItem.content}
                            className={styles.mardownReview}
                        />
                    </div>
                </div>
            </td>
        </tr>
    )
}

function renderAppealCommentRow({
    actionChallengeRole,
    addAppealResponse,
    canRespondToAppeal,
    className,
    commentAppeal,
    index,
    isManagerRole,
    isSavingAppealResponse,
    reviewItem,
    scorecardQuestion,
    totalComments,
}: {
    actionChallengeRole?: string
    addAppealResponse: Props['addAppealResponse']
    canRespondToAppeal: boolean
    className?: string
    commentAppeal?: AppealInfo
    index: number
    isManagerRole: boolean
    isSavingAppealResponse: boolean
    reviewItem: ReviewItemInfo
    scorecardQuestion: ScorecardQuestion
    totalComments: number
}): JSX.Element | undefined {
    if (
        !commentAppeal
        || !includes([REVIEWER, COPILOT, ADMIN], actionChallengeRole)
    ) {
        return undefined
    }

    return (
        <tr
            className={classNames(
                styles.container,
                className,
                styles.blockRowAppealComment,
                {
                    [styles.isLast]: index === totalComments - 1 && !isManagerRole,
                },
            )}
        >
            <td colSpan={3}>
                <AppealComment
                    data={commentAppeal}
                    scorecardQuestion={scorecardQuestion}
                    isSavingAppealResponse={isSavingAppealResponse}
                    reviewItem={reviewItem}
                    appealInfo={commentAppeal}
                    addAppealResponse={addAppealResponse}
                    canRespondToAppeal={canRespondToAppeal}
                />
            </td>
        </tr>
    )
}

function renderManagerCommentRow({
    className,
    managerCommentContent,
    shouldMarkManagerRowAsLast,
    shouldShowManagerRowHere,
}: {
    className?: string
    managerCommentContent?: ReactNode
    shouldMarkManagerRowAsLast: boolean
    shouldShowManagerRowHere: boolean
}): JSX.Element | undefined {
    if (!shouldShowManagerRowHere || !managerCommentContent) {
        return undefined
    }

    return (
        <tr
            className={classNames(
                styles.container,
                className,
                styles.blockRowManagerComment,
                {
                    [styles.isLast]: shouldMarkManagerRowAsLast,
                },
            )}
        >
            <td colSpan={3}>{managerCommentContent}</td>
        </tr>
    )
}

function renderSubmitterAppealRow({
    actionChallengeRole,
    addAppeal,
    className,
    commentAppeal,
    commentItem,
    doDeleteAppeal,
    index,
    isSavingAppeal,
    totalComments,
}: {
    actionChallengeRole?: string
    addAppeal: Props['addAppeal']
    className?: string
    commentAppeal?: AppealInfo
    commentItem: ReviewItemComment
    doDeleteAppeal: Props['doDeleteAppeal']
    index: number
    isSavingAppeal: boolean
    totalComments: number
}): JSX.Element | undefined {
    if (!includes([SUBMITTER], actionChallengeRole)) {
        return undefined
    }

    return (
        <tr
            className={classNames(
                styles.container,
                className,
                styles.blockRowAppealComment,
                {
                    [styles.isLast]: index === totalComments - 1,
                },
            )}
        >
            <td
                colSpan={3}
                className={classNames(
                    includes(FINISHTAB, sessionStorage.getItem(TAB))
                        ? styles.isEmpty
                        : '',
                )}
            >
                <Appeal
                    appealInfo={commentAppeal}
                    commentItem={commentItem}
                    isSavingAppeal={isSavingAppeal}
                    addAppeal={addAppeal}
                    doDeleteAppeal={doDeleteAppeal}
                />
            </td>
        </tr>
    )
}

export const ScorecardQuestionView: FC<Props> = (props: Props) => {
    const addAppeal = props.addAppeal
    const addAppealResponse = props.addAppealResponse
    const addManagerComment = props.addManagerComment
    const className = props.className
    const doDeleteAppeal = props.doDeleteAppeal
    const expandState = props.isExpand
    const groupIndex = props.groupIndex
    const isManagerEdit = props.isManagerEdit
    const isSavingAppeal = props.isSavingAppeal
    const isSavingAppealResponse = props.isSavingAppealResponse
    const isSavingManagerComment = props.isSavingManagerComment
    const mappingAppeals = props.mappingAppeals
    const questionIndex = props.questionIndex
    const reviewInfo = props.reviewInfo
    const reviewItem = props.reviewItem
    const scorecardQuestion = props.scorecardQuestion
    const sectionIndex = props.sectionIndex
    const setIsExpand = props.setIsExpand
    const { actionChallengeRole }: useRoleProps = useRole()
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isMobile = useMemo(() => screenWidth <= 745, [screenWidth])

    const isExpanded = expandState[reviewItem.id]
    const reviewerHandle = reviewInfo?.reviewerHandle
    const isManagerEditMode = isManagerEdit ?? false
    const currentScoreValue = useMemo(
        () => reviewItem.finalAnswer ?? reviewItem.initialAnswer ?? '',
        [reviewItem.finalAnswer, reviewItem.initialAnswer],
    )
    const existingManagerComment = reviewItem.managerComment ?? ''

    const [selectedScore, setSelectedScore] = useState(currentScoreValue)
    const [managerCommentDraft, setManagerCommentDraft] = useState('')
    const [showManagerCommentForm, setShowManagerCommentForm] = useState(false)

    useEffect(() => {
        setSelectedScore(currentScoreValue)
        setShowManagerCommentForm(false)
        setManagerCommentDraft('')
    }, [currentScoreValue, isManagerEditMode])

    const responseOptions = useMemo<SelectOption[]>(
        () => getResponseOptions(scorecardQuestion),
        [scorecardQuestion],
    )

    const selectValue = useMemo(
        () => (selectedScore
            ? {
                label: selectedScore,
                value: selectedScore,
            }
            : undefined),
        [selectedScore],
    )

    const handleScoreChange = useCallback((option: SingleValue<SelectOption>) => {
        const nextValue = (option as SelectOption | null)?.value ?? ''
        setSelectedScore(nextValue)

        if (nextValue && nextValue !== currentScoreValue) {
            setShowManagerCommentForm(true)
            setManagerCommentDraft(prev => (prev || existingManagerComment))
        } else {
            setShowManagerCommentForm(false)
            setManagerCommentDraft('')
        }
    }, [currentScoreValue, existingManagerComment])

    const handleCancelManagerEdit = useCallback(() => {
        setSelectedScore(currentScoreValue)
        setShowManagerCommentForm(false)
        setManagerCommentDraft('')
    }, [currentScoreValue])

    const handleSubmitManagerComment = useCallback(() => {
        if (
            !selectedScore
            || selectedScore === currentScoreValue
            || !managerCommentDraft.trim()
        ) {
            return
        }

        addManagerComment(
            managerCommentDraft,
            selectedScore,
            reviewItem,
            () => {
                setShowManagerCommentForm(false)
                setManagerCommentDraft('')
            },
        )
    }, [
        addManagerComment,
        currentScoreValue,
        managerCommentDraft,
        reviewItem,
        selectedScore,
    ])

    const canRespondToAppeal = useMemo(() => {
        if (!loginUserInfo?.handle || !reviewerHandle) {
            return false
        }

        if (actionChallengeRole !== REVIEWER) {
            return false
        }

        return loginUserInfo.handle.toLowerCase()
            === reviewerHandle.toLowerCase()
    }, [actionChallengeRole, loginUserInfo?.handle, reviewerHandle])

    const finalAnswer = useMemo(
        () => getFormattedAnswer(reviewItem),
        [reviewItem],
    )

    const showManagerCommentEditor = isManagerEditMode && showManagerCommentForm
    const hasManagerComment = Boolean(existingManagerComment)
    const shouldRenderManagerCommentRow
        = showManagerCommentEditor || hasManagerComment
    const canEditScore = isManagerEditMode && responseOptions.length > 0
    const isSubmitDisabled = isSavingManagerComment
        || !selectedScore
        || selectedScore === currentScoreValue
        || !managerCommentDraft.trim()
    const isSubmitterRole = includes([SUBMITTER], actionChallengeRole)
    const isManagerRole = includes([COPILOT, ADMIN], actionChallengeRole)

    const managerCommentContent = buildManagerCommentContent({
        existingManagerComment,
        handleCancelManagerEdit,
        handleSubmitManagerComment,
        hasManagerComment,
        isSavingManagerComment,
        isSubmitDisabled,
        managerCommentDraft,
        reviewItemId: reviewItem.id,
        selectedScore,
        setManagerCommentDraft,
        showManagerCommentEditor,
    })

    const commentRows = buildCommentRows({
        actionChallengeRole,
        addAppeal,
        addAppealResponse,
        canRespondToAppeal,
        className,
        doDeleteAppeal,
        isManagerRole,
        isMobile,
        isSavingAppeal,
        isSavingAppealResponse,
        isSubmitterRole,
        managerCommentContent,
        mappingAppeals,
        reviewItem,
        scorecardQuestion,
        shouldRenderManagerCommentRow,
    })

    const questionHeaderRow = (
        <tr
            className={classNames(
                styles.container,
                className,
                styles.blockRowQuestionHeader,
                {
                    [styles.isExpand]: isExpanded,
                },
            )}
        >
            <td className={styles.blockCellQuestion}>
                <button
                    type='button'
                    className={classNames(styles.btnExpand, {
                        [styles.expand]: isExpanded,
                    })}
                    onClick={function onClick() {
                        setIsExpand({
                            ...expandState,
                            [reviewItem.id]: !isExpanded,
                        })
                    }}
                >
                    <IconChevronDown />
                </button>
                <span className={styles.textQuestion}>
                    <strong>
                        {`Question ${groupIndex + 1}.${sectionIndex + 1}.${questionIndex + 1}`}
                    </strong>
                    {' '}
                    {scorecardQuestion.description}
                </span>
            </td>
            <td className={styles.blockCellWeight}>
                <i>Weight: </i>
                {scorecardQuestion.weight.toFixed(1)}
            </td>
            <td className={styles.blockCellResponse}>
                {canEditScore ? (
                    <Select
                        className={classNames(
                            'react-select-container',
                            styles.managerSelect,
                        )}
                        classNamePrefix='select'
                        name='manager-score'
                        placeholder='Select'
                        value={selectValue}
                        options={responseOptions}
                        onChange={handleScoreChange}
                        isDisabled={isSavingManagerComment}
                    />
                ) : finalAnswer}
            </td>
        </tr>
    )

    const guidelinesRow = buildGuidelinesRow({
        className,
        isExpanded,
        scorecardQuestion,
    })

    const managerCommentRow = buildManagerCommentRow({
        addManagerComment,
        className,
        isManagerRole,
        isSavingManagerComment,
        reviewInfo,
        reviewItem,
        scorecardQuestion,
    })

    return (
        <>
            {questionHeaderRow}
            {guidelinesRow}
            {commentRows}
            {managerCommentRow}
        </>
    )
}

export default ScorecardQuestionView
