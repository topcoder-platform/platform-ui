import { FC, useCallback, useState } from 'react'
import { mutate } from 'swr'
import classNames from 'classnames'
import moment from 'moment'

import { useReviewsContext } from '~/apps/review/src/pages/reviews/ReviewsContext'
import { createFeedbackComment, updateRunItemComment } from '~/apps/review/src/lib/services'
import { AiFeedbackItem, ReviewsContextModel } from '~/apps/review/src/lib/models'
import { EnvironmentConfig } from '~/config'

import { AiFeedbackActions } from '../AiFeedbackActions/AiFeedbackActions'
import { AiFeedbackReply } from '../AiFeedbackReply/AiFeedbackReply'
import { MarkdownReview } from '../../../../MarkdownReview'

import { AiFeedbackComment as AiFeedbackCommentType, AiFeedbackComments } from './AiFeedbackComments'
import styles from './AiFeedbackComments.module.scss'

interface AiFeedbackCommentProps {
    comment: AiFeedbackCommentType
    feedback: AiFeedbackItem
    isRoot: boolean
}

export const AiFeedbackComment: FC<AiFeedbackCommentProps> = props => {
    const { workflowId, workflowRun }: ReviewsContextModel = useReviewsContext()
    const [editMode, setEditMode] = useState(false)
    const [showReply, setShowReply] = useState(false)

    const onPressEdit = useCallback(() => {
        setEditMode(true)
        setShowReply(false)
    }, [])

    const onSubmitReply = useCallback(async (content: string, comment: AiFeedbackCommentType) => {
        await createFeedbackComment(workflowId as string, workflowRun?.id as string, props.feedback?.id, {
            content,
            parentId: comment.id,
        })
        // eslint-disable-next-line max-len
        await mutate(`${EnvironmentConfig.API.V6}/workflows/${workflowId}/runs/${workflowRun?.id}/items?[${workflowRun?.status}]`)
        setShowReply(false)
    }, [workflowId, workflowRun?.id, props.feedback?.id])

    const onEditReply = useCallback(async (content: string, comment: AiFeedbackCommentType) => {
        await updateRunItemComment(workflowId as string, workflowRun?.id as string, props.feedback?.id, comment.id, {
            content,
        })
        // eslint-disable-next-line max-len
        await mutate(`${EnvironmentConfig.API.V6}/workflows/${workflowId}/runs/${workflowRun?.id}/items?[${workflowRun?.status}]`)
        setEditMode(false)
    }, [workflowId, workflowRun?.id, props.feedback?.id])

    return (
        <div
            key={props.comment.id}
            className={classNames(styles.comment, {
                [styles.noMarginTop]: !props.isRoot,
            })}
        >
            <div className={styles.info}>
                <span className={styles.reply}>Reply</span>
                <span className={styles.text}> by </span>
                <span
                    style={{
                        color: props.comment.createdUser.ratingColor || '#0A0A0A',
                    }}
                    className={styles.name}
                >
                    {props.comment.createdUser.handle}
                </span>
                <span className={styles.text}> on </span>
                <span className={styles.date}>
                    { moment(props.comment.createdAt)
                        .local()
                        .format('MMM DD, hh:mm A')}
                </span>
            </div>
            {
                !editMode && <MarkdownReview value={props.comment.content} />
            }
            {
                editMode && (
                    <AiFeedbackReply
                        id={props.comment.id}
                        initialValue={props.comment.content}
                        onSubmitReply={function submitReply(content: string) {
                            return onEditReply(content, props.comment)
                        }}
                        onCloseReply={function closeReply() {
                            setEditMode(false)
                        }}
                    />
                )
            }
            <AiFeedbackActions
                feedback={props.feedback}
                comment={props.comment}
                actionType='comment'
                onPressEdit={onPressEdit}
            />
            {
                showReply && (
                    <AiFeedbackReply
                        onSubmitReply={function submitReply(content: string) {
                            return onSubmitReply(content, props.comment)
                        }}
                        onCloseReply={function closeReply() {
                            setShowReply(false)
                        }}
                    />
                )
            }
            <AiFeedbackComments comments={props.comment.comments} feedback={props.feedback} isRoot={false} />
        </div>
    )
}
