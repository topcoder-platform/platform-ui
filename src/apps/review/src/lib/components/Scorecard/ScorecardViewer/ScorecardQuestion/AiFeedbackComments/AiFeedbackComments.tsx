import { FC } from 'react'

import { AiFeedbackComment } from './AiFeedbackComment'

import styles from './AiFeedbackComments.module.scss'
import classNames from 'classnames'

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
    comments: AiFeedbackComment[]
    votes: AiFeedbackVote[]
}

interface AiFeedbackCommentsProps {
    comments: AiFeedbackComment[]
    feedback: any
    isRoot: boolean
}

export const AiFeedbackComments: FC<AiFeedbackCommentsProps> = props => (
    <div className={classNames(styles.comments)}>
        {props.comments
            .map((comment: AiFeedbackComment) => (
                <AiFeedbackComment isRoot={props.isRoot} comment={comment} feedback={props.feedback} />
            ))}
    </div>
)
