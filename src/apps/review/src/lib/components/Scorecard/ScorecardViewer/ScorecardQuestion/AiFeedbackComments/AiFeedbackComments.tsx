import { FC } from 'react'
import moment from 'moment'

import { AiFeedbackActions } from '../AiFeedbackActions/AiFeedbackActions'

import styles from './AiFeedbackComments.module.scss'

export interface AiFeedbackVote {
    id: string
    parentId: string
    voteType: string
    createdAt: string
    createdBy: string
}
export interface AiFeedbackComment {
    id: string
    content: string
    parentId: string
    createdBy: string
    createdAt: string
    createdUser: {
        userId: string
        handle: string
        ratingColor: string
    }
    votes: AiFeedbackVote[]
}

interface AiFeedbackCommentsProps {
    comments: AiFeedbackComment[]
    feedback: any
}

export const AiFeedbackComments: FC<AiFeedbackCommentsProps> = props => (
    <div className={styles.comments}>
        {props.comments.filter(c => !c.parentId)
            .map((comment: AiFeedbackComment) => (
                <div key={comment.id} className={styles.comment}>
                    <div className={styles.info}>
                        <span className={styles.reply}>Reply</span>
                        <span className={styles.text}> by </span>
                        <span
                            style={{
                                color: comment.createdUser.ratingColor || '#0A0A0A',
                            }}
                            className={styles.name}
                        >
                            {comment.createdUser.handle}
                        </span>
                        <span className={styles.text}> on </span>
                        <span className={styles.date}>{ moment(comment.createdAt).local().format('MMM DD, hh:mm A')}</span>
                    </div>
                    <div className={styles.commentContent}>{comment.content}</div>
                    <AiFeedbackActions feedback={props.feedback} comment={comment} actionType='comment' />
                </div>
            ))}
    </div>
)
