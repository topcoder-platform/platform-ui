import { FC, useCallback, useState } from "react"
import { AiFeedbackComments, AiFeedbackComment as AiFeedbackCommentType } from "./AiFeedbackComments"
import { mutate } from "swr"
import moment from "moment"
import classNames from "classnames"

import { useReviewsContext } from "~/apps/review/src/pages/reviews/ReviewsContext"
import { createFeedbackComment } from "~/apps/review/src/lib/services"
import { AiFeedbackItem, ReviewsContextModel } from "~/apps/review/src/lib/models"
import { EnvironmentConfig } from "~/config"

import { AiFeedbackActions } from "../AiFeedbackActions/AiFeedbackActions"
import { AiFeedbackReply } from "../AiFeedbackReply/AiFeedbackReply"
import { MarkdownReview } from "../../../../MarkdownReview"

import styles from "./AiFeedbackComments.module.scss"

interface AiFeedbackCommentProps {
    comment: AiFeedbackCommentType
    feedback: AiFeedbackItem
    isRoot: boolean
}

export const AiFeedbackComment: FC<AiFeedbackCommentProps> = (props) => {
    const { workflowId, workflowRun }: ReviewsContextModel = useReviewsContext()
    const [showReply, setShowReply] = useState(false)

    const onShowReply = useCallback(() => {
        setShowReply(!showReply)
    }, [])

    const onSubmitReply = useCallback(async (content: string, comment: AiFeedbackCommentType) => {
        await createFeedbackComment(workflowId as string, workflowRun?.id as string, props.feedback?.id, {
            content,
            parentId: comment.id,
        })
        await mutate(`${EnvironmentConfig.API.V6}/workflows/${workflowId}/runs/${workflowRun?.id}/items`)
        setShowReply(false)
    }, [workflowId, workflowRun?.id, props.feedback?.id])
    return (
        <div key={props.comment.id} className={classNames(styles.comment, {
            [styles.noMarginTop]: !props.isRoot,
        })}>
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
            <MarkdownReview value={props.comment.content} />
            <AiFeedbackActions feedback={props.feedback} comment={props.comment} actionType='comment' onPressReply={onShowReply}/>
            {
                showReply && (
                    <AiFeedbackReply onSubmitReply={function submitReply(content: string) {
                        return onSubmitReply(content, props.comment)
                    }} onCloseReply={function closeReply() {
                        setShowReply(false)
                    }} />
                )
            }
            <AiFeedbackComments comments={props.comment.comments} feedback={props.feedback} isRoot={false} />
        </div>
    )
}
