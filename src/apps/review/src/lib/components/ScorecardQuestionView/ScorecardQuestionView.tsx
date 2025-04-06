/**
 * Scorecard Question View.
 */
import { FC, Fragment, useMemo } from 'react'
import classNames from 'classnames'

import { useWindowSize, WindowSize } from '~/libs/shared'

import { AppealComment } from '../AppealComment'
import { MarkdownReview } from '../MarkdownReview'
import { AppealInfo, ReviewItemInfo, ScorecardQuestion } from '../../models'
import { stringIsNumberic } from '../../utils'

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
}

export const ScorecardQuestionView: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isMobile = useMemo(() => screenWidth <= 745, [screenWidth])

    const finalAnswer = useMemo(
        () => (stringIsNumberic(props.reviewItem.finalAnswer)
            ? `Rating ${props.reviewItem.finalAnswer}`
            : props.reviewItem.finalAnswer),
        [props.reviewItem.finalAnswer],
    )

    return (
        <>
            <tr
                className={classNames(
                    styles.container,
                    props.className,
                    styles.blockRowQuestionHeader,
                )}
            >
                <td className={styles.blockCellQuestion}>
                    Question
                    {' '}
                    {props.groupIndex + 1}
                    .
                    {props.sectionIndex + 1}
                    .
                    {props.questionIndex + 1}
                    {' '}
                    {props.scorecardQuestion.description}
                </td>
                <td className={styles.blockCellWeight}>
                    {props.scorecardQuestion.weight.toFixed(1)}
                </td>
                <td className={styles.blockCellResponse}>{finalAnswer}</td>
            </tr>

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
                                    === props.reviewItem.reviewItemComments.length
                                    - 1
                                    && !props.mappingAppeals[commentItem.id],
                            },
                        )}
                    >
                        <td colSpan={isMobile ? 3 : 1}>
                            <div className={styles.blockResponseComment}>
                                <span className={styles.textResponse}>
                                    Response
                                    {' '}
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
                    {props.mappingAppeals[commentItem.id] && (
                        <tr
                            key={commentItem.sortOrder}
                            className={classNames(
                                styles.container,
                                props.className,
                                styles.blockRowAppealComment,
                                {
                                    [styles.isLast]:
                                        index
                                        === props.reviewItem.reviewItemComments.length
                                        - 1,
                                },
                            )}
                        >
                            <td colSpan={3}>
                                <AppealComment
                                    data={props.mappingAppeals[commentItem.id]}
                                />
                            </td>
                        </tr>
                    )}
                </Fragment>
            ))}
        </>
    )
}

export default ScorecardQuestionView
