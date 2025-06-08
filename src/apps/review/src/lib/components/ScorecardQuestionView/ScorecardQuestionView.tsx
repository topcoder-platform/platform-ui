/**
 * Scorecard Question View.
 */
import { Dispatch, FC, Fragment, SetStateAction, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { includes } from 'lodash'
import classNames from 'classnames'

import { useWindowSize, WindowSize } from '~/libs/shared'

import { AppealComment } from '../AppealComment'
import { MarkdownReview } from '../MarkdownReview'
import { AppealInfo, ReviewItemInfo, ScorecardQuestion } from '../../models'
import { stringIsNumberic } from '../../utils'
import { IconChevronDown } from '../../assets/icons'
import { useFetchChallengeInfo, useFetchChallengeInfoProps, useRole } from '../../hooks'
import { ADMIN, COPILOT, FINISHTAB, REVIEWER, TAB, WITHOUT_APPEAL } from '../../../config/index.config'
import { Appeal } from '../Appeal'
import { ManagerComment } from '../ManagerComment'

import styles from './ScorecardQuestionView.module.scss'

interface Props {
    className?: string
    scorecardQuestion: ScorecardQuestion
    reviewItem: ReviewItemInfo
    groupIndex: number
    sectionIndex: number
    questionIndex: number
    mappingAppeals: {
        [reviewItemCommentId: string]: AppealInfo
    }
    isExpand: { [key: string]: boolean }
    setIsExpand: Dispatch<
        SetStateAction<{
            [key: string]: boolean
        }>
    >
    updateReviewItem?: (reviewItem: ReviewItemInfo) => void
}

export const ScorecardQuestionView: FC<Props> = (props: Props) => {
    const params = useParams()
    const { role }: {role: string} = useRole()
    const isExpand = props.isExpand[props.reviewItem.id]
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isMobile = useMemo(() => screenWidth <= 745, [screenWidth])

    const { challengeInfo }: useFetchChallengeInfoProps
        = useFetchChallengeInfo(params.challengeId)

    const finalAnswer = useMemo(() => {
        if (stringIsNumberic(props.reviewItem.finalAnswer)) {
            return `Rating ${props.reviewItem.finalAnswer}`
        }

        return props.reviewItem.finalAnswer

    }, [props.reviewItem.finalAnswer])

    const updateFinalAnswer = useCallback(
        (value: string) => {
            if (props.updateReviewItem) {
                props.updateReviewItem({
                    ...props.reviewItem,
                    finalAnswer: value,
                    initialAnswer: value,
                })
            }
        },
        [props],
    )

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
                            Question
                            {props.groupIndex + 1}
                            .
                            {props.sectionIndex + 1}
                            .
                            {props.questionIndex + 1}
                        </strong>
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

            {props.reviewItem.reviewItemComments.map((commentItem, index) => (
                <Fragment key={commentItem.sortOrder}>
                    <tr
                        className={classNames(
                            styles.container,
                            props.className,
                            styles.blockRowResponseComment,
                            {
                                [styles.isLast]:
                                    index
                                    === props.reviewItem.reviewItemComments
                                        .length
                                            - 1,
                            },
                        )}
                    >
                        <td colSpan={isMobile ? 3 : 2}>
                            <div className={styles.blockResponseComment}>
                                <span className={styles.textResponse}>
                                    Response
                                    {index + 1}
                                    :
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
                    {!includes(WITHOUT_APPEAL, challengeInfo?.type)
                        && (includes([REVIEWER, COPILOT, ADMIN], role) ? (
                            props.mappingAppeals[commentItem.id] && (
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
                                                    role,
                                                ),
                                        },
                                    )}
                                >
                                    <td colSpan={3}>
                                        <AppealComment
                                            role={role}
                                            data={
                                                props.mappingAppeals[
                                                    commentItem.id
                                                ]
                                            }
                                        />
                                    </td>
                                </tr>
                            )
                        ) : (
                            <tr
                                className={classNames(
                                    styles.container,
                                    props.className,
                                    styles.blockRowAppealComment,
                                    {
                                        [styles.isLast]:
                                            index
                                                === props.reviewItem
                                                    .reviewItemComments.length
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
                                    <Appeal role={role} />
                                </td>
                            </tr>
                        ))}
                </Fragment>
            ))}
            {includes([COPILOT, ADMIN], role) && (
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
                            updateScorecardQuestion={updateFinalAnswer}
                        />
                    </td>
                </tr>
            )}
        </>
    )
}

export default ScorecardQuestionView
