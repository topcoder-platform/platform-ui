/**
 * Scorecard Question View.
 */
import {
    Dispatch,
    FC,
    Fragment,
    SetStateAction,
    useMemo,
} from 'react'
import { includes } from 'lodash'
import classNames from 'classnames'

import { useWindowSize, WindowSize } from '~/libs/shared'

import { AppealComment } from '../AppealComment'
import { MarkdownReview } from '../MarkdownReview'
import {
    AppealInfo,
    MappingAppeal,
    ReviewInfo,
    ReviewItemInfo,
    ScorecardQuestion,
} from '../../models'
import { stringIsNumberic } from '../../utils'
import { IconChevronDown } from '../../assets/icons'
import { useRole, useRoleProps } from '../../hooks'
import {
    ADMIN,
    COPILOT,
    FINISHTAB,
    REVIEWER,
    SUBMITTER,
    TAB,
} from '../../../config/index.config'
import { Appeal } from '../Appeal'
import { ManagerComment } from '../ManagerComment'
import { ReviewItemComment } from '../../models/ReviewItemComment.model'

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
}

export const ScorecardQuestionView: FC<Props> = (props: Props) => {
    const { actionChallengeRole, myChallengeResources }: useRoleProps = useRole()
    const isExpand = props.isExpand[props.reviewItem.id]
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isMobile = useMemo(() => screenWidth <= 745, [screenWidth])

    const reviewResourceId = props.reviewInfo?.resourceId

    const canRespondToAppeal = useMemo(() => {
        if (actionChallengeRole !== REVIEWER || !reviewResourceId) {
            return false
        }

        return myChallengeResources.some(
            resource => resource.id === reviewResourceId,
        )
    }, [actionChallengeRole, myChallengeResources, reviewResourceId])

    const finalAnswer = useMemo(() => {
        const answer
            = props.reviewItem.finalAnswer || props.reviewItem.initialAnswer
        if (stringIsNumberic(answer)) {
            return `Rating ${answer}`
        }

        return answer
    }, [props.reviewItem.finalAnswer, props.reviewItem.initialAnswer])

    return (
        <>
            <tr
                className={classNames(
                    styles.container,
                    props.className,
                    styles.blockRowQuestionHeader,
                    {
                        [styles.isExpand]: isExpand,
                    },
                )}
            >
                <td className={styles.blockCellQuestion}>
                    <button
                        type='button'
                        className={classNames(styles.btnExpand, {
                            [styles.expand]: isExpand,
                        })}
                        onClick={function onClick() {
                            props.setIsExpand({
                                ...props.isExpand,
                                [props.reviewItem.id]: !isExpand,
                            })
                        }}
                    >
                        <IconChevronDown />
                    </button>
                    <span className={styles.textQuestion}>
                        <strong>
                            {`Question ${props.groupIndex + 1}.${props.sectionIndex + 1}.${props.questionIndex + 1}`}
                        </strong>
                        {' '}
                        {props.scorecardQuestion.description}
                    </span>
                </td>
                <td className={styles.blockCellWeight}>
                    <i>Weight: </i>
                    {props.scorecardQuestion.weight.toFixed(1)}
                </td>
                <td className={styles.blockCellResponse}>{finalAnswer}</td>
            </tr>
            {isExpand && (
                <tr
                    className={classNames(
                        styles.container,
                        props.className,
                        styles.blockRowGuidelines,
                    )}
                >
                    <td colSpan={3}>
                        <MarkdownReview
                            value={props.scorecardQuestion.guidelines}
                            className={styles.textGuidelines}
                        />
                    </td>
                </tr>
            )}

            {props.reviewItem.reviewItemComments.map((commentItem, index) => {
                const commentAppeal
                    = props.mappingAppeals[commentItem.id]
                    ?? commentItem.appeal

                return (
                    <Fragment key={commentItem.sortOrder}>
                        <tr
                            className={classNames(
                                styles.container,
                                props.className,
                                styles.blockRowResponseComment,
                                {
                                    [styles.isLast]:
                                        index
                                        === props.reviewItem.reviewItemComments.length
                                            - 1,
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
                        {includes(
                            [REVIEWER, COPILOT, ADMIN],
                            actionChallengeRole,
                        ) && commentAppeal && (
                            <tr
                                key={commentItem.sortOrder}
                                className={classNames(
                                    styles.container,
                                    props.className,
                                    styles.blockRowAppealComment,
                                    {
                                        [styles.isLast]:
                                            index
                                                === props.reviewItem
                                                    .reviewItemComments
                                                    .length
                                                    - 1
                                            && !includes(
                                                [COPILOT, ADMIN],
                                                actionChallengeRole,
                                            ),
                                    },
                                )}
                            >
                                <td colSpan={3}>
                                    <AppealComment
                                        data={commentAppeal}
                                        scorecardQuestion={props.scorecardQuestion}
                                        isSavingAppealResponse={props.isSavingAppealResponse}
                                        reviewItem={props.reviewItem}
                                        appealInfo={commentAppeal}
                                        addAppealResponse={props.addAppealResponse}
                                        canRespondToAppeal={canRespondToAppeal}
                                    />
                                </td>
                            </tr>
                        )}

                        {includes(
                            [SUBMITTER],
                            actionChallengeRole,
                        ) && (
                            <tr
                                className={classNames(
                                    styles.container,
                                    props.className,
                                    styles.blockRowAppealComment,
                                    {
                                        [styles.isLast]:
                                            index
                                            === props.reviewItem.reviewItemComments
                                                .length
                                                - 1,
                                    },
                                )}
                            >
                                <td
                                    colSpan={3}
                                    className={classNames(
                                        includes(
                                            FINISHTAB,
                                            sessionStorage.getItem(TAB),
                                        )
                                            ? styles.isEmpty
                                            : '',
                                    )}
                                >
                                    <Appeal
                                        appealInfo={commentAppeal}
                                        commentItem={commentItem}
                                        isSavingAppeal={props.isSavingAppeal}
                                        addAppeal={props.addAppeal}
                                        doDeleteAppeal={props.doDeleteAppeal}
                                    />
                                </td>
                            </tr>
                        )}
                    </Fragment>
                )
            })}
            {includes([COPILOT, ADMIN], actionChallengeRole) && !props.reviewInfo?.id && (
                <tr
                    className={classNames(
                        styles.container,
                        props.className,
                        styles.blockRowManagerComment,
                        styles.isLast,
                    )}
                >
                    <td colSpan={3}>
                        <ManagerComment
                            scorecardQuestion={props.scorecardQuestion}
                            reviewItem={props.reviewItem}
                            isSavingManagerComment={props.isSavingManagerComment}
                            addManagerComment={props.addManagerComment}
                        />
                    </td>
                </tr>
            )}
        </>
    )
}

export default ScorecardQuestionView
