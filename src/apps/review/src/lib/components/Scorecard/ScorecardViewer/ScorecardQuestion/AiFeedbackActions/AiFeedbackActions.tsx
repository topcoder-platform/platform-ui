/* eslint-disable react/jsx-no-bind */
import { FC, useCallback, useContext, useEffect, useState } from 'react'
import { mutate } from 'swr'

import {
    IconEditReply,
    IconReply,
    IconThumbsDown,
    IconThumbsDownFilled,
    IconThumbsUp,
    IconThumbsUpFilled,
} from '~/apps/review/src/lib/assets/icons'
import { ReviewAppContext } from '~/apps/review/src/lib/contexts'
import { useReviewsContext } from '~/apps/review/src/pages/reviews/ReviewsContext'
import { updateLikesOrDislikesOnRunItem, updateRunItemComment } from '~/apps/review/src/lib/services'
import { EnvironmentConfig } from '~/config'
import { ReviewAppContextModel, ReviewsContextModel } from '~/apps/review/src/lib/models'

import { AiFeedbackComment } from '../AiFeedbackComments/AiFeedbackComments'

import styles from './AiFeedbackActions.module.scss'

export enum VOTE_TYPE {
    UPVOTE = 'UPVOTE',
    DOWNVOTE = 'DOWNVOTE'
}

interface AiFeedbackActionsProps {
    actionType: 'comment' | 'runItem'
    comment?: AiFeedbackComment
    feedback?: any
    onPressReply?: () => void
    onPressEdit?: () => void
}

export const AiFeedbackActions: FC<AiFeedbackActionsProps> = props => {

    const [userVote, setUserVote] = useState<string | undefined>(undefined)
    const [upVotes, setUpVotes] = useState<number>(0)
    const [downVotes, setDownVotes] = useState<number>(0)

    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const { workflowId, workflowRun }: ReviewsContextModel = useReviewsContext()

    const votesArr: any[] = (props.actionType === 'runItem' ? (props.feedback?.votes) : (props.comment?.votes)) || []

    const setInitialVotesForFeedback = useCallback((): void => {
        const initialUp = props.feedback?.upVotes ?? votesArr.filter(v => String(v.voteType)
            .toLowerCase()
            .includes('up')).length
        const initialDown = props.feedback?.downVotes ?? votesArr.filter(v => String(v.voteType)
            .toLowerCase()
            .includes('down')).length

        const myVote = votesArr.find(v => String(v.createdBy) === String(loginUserInfo?.userId))
        setUpVotes(initialUp)
        setDownVotes(initialDown)
        setUserVote(myVote?.voteType ?? undefined)
    }, [votesArr, props.feedback])

    const setInitialVotesForComment = useCallback((): void => {
        const initialUp = votesArr.filter(v => String(v.voteType)
            .toLowerCase()
            .includes('up')).length
        const initialDown = votesArr.filter(v => String(v.voteType)
            .toLowerCase()
            .includes('down')).length

        const myVote = votesArr.find(v => String(v.createdBy) === String(loginUserInfo?.userId))
        setUpVotes(initialUp)
        setDownVotes(initialDown)
        setUserVote(myVote?.voteType ?? undefined)
    }, [votesArr])

    useEffect(() => {
        if (props.actionType === 'runItem') {
            setInitialVotesForFeedback()
        } else {
            setInitialVotesForComment()
        }
    }, [props.actionType, props.feedback?.id, votesArr.length, loginUserInfo?.userId])

    const voteOnItem = useCallback(async (type: VOTE_TYPE) => {
        if (!workflowId || !workflowRun?.id) return
        const current = userVote
        let up = false
        let down = false

        if (current === type) {
            // remove vote
            up = false
            down = false
        } else if (!current) {
            up = type === VOTE_TYPE.UPVOTE
            down = type === VOTE_TYPE.DOWNVOTE
        } else {
            // switch vote
            up = type === VOTE_TYPE.UPVOTE
            down = type === VOTE_TYPE.DOWNVOTE
        }

        // optimistic update
        const prevUserVote = userVote
        const prevUp = upVotes
        const prevDown = downVotes

        if (current === type) {
            // removing
            if (type === VOTE_TYPE.UPVOTE) setUpVotes(Math.max(0, upVotes - 1))
            else setDownVotes(Math.max(0, downVotes - 1))
            setUserVote(undefined)
        } else if (!current) {
            if (type === VOTE_TYPE.UPVOTE) setUpVotes(upVotes + 1)
            else setDownVotes(downVotes + 1)
            setUserVote(type)
        } else {
            // switch
            if (type === VOTE_TYPE.UPVOTE) {
                setUpVotes(upVotes + 1)
                setDownVotes(Math.max(0, downVotes - 1))
            } else {
                setDownVotes(downVotes + 1)
                setUpVotes(Math.max(0, upVotes - 1))
            }

            setUserVote(type)
        }

        try {
            await updateLikesOrDislikesOnRunItem(workflowId, workflowRun.id, props.feedback.id, {
                downVote: down,
                upVote: up,
            })
        } catch (err) {
            // rollback
            setUserVote(prevUserVote)
            setUpVotes(prevUp)
            setDownVotes(prevDown)
        }
    }, [workflowId, workflowRun, props.feedback?.id, userVote, upVotes, downVotes])

    const voteOnComment = useCallback(async (c: any, type: VOTE_TYPE) => {
        if (!workflowId || !workflowRun?.id) return
        const votes = (c.votes || [])
        const my = votes.find((v: any) => String(v.createdBy) === String(loginUserInfo?.userId))
        const current = my?.voteType ?? undefined

        let up = false
        let down = false

        if (current === type) {
            up = false
            down = false
        } else if (!current) {
            up = type === VOTE_TYPE.UPVOTE
            down = type === VOTE_TYPE.DOWNVOTE
        } else {
            up = type === VOTE_TYPE.UPVOTE
            down = type === VOTE_TYPE.DOWNVOTE
        }

        const prevUserVote = userVote
        const prevUp = upVotes
        const prevDown = downVotes

        if (current === type) {
            // removing
            if (type === VOTE_TYPE.UPVOTE) setUpVotes(Math.max(0, upVotes - 1))
            else setDownVotes(Math.max(0, downVotes - 1))
            setUserVote(undefined)
        } else if (!current) {
            if (type === VOTE_TYPE.UPVOTE) setUpVotes(upVotes + 1)
            else setDownVotes(downVotes + 1)
            setUserVote(type)
        } else {
            // switch
            if (type === VOTE_TYPE.UPVOTE) {
                setUpVotes(upVotes + 1)
                setDownVotes(Math.max(0, downVotes - 1))
            } else {
                setDownVotes(downVotes + 1)
                setUpVotes(Math.max(0, upVotes - 1))
            }

            setUserVote(type)

        }

        try {
            await updateRunItemComment(workflowId, workflowRun.id, props.feedback.id, c.id, {
                downVote: down,
                upVote: up,
            })
            await mutate(`${EnvironmentConfig.API.V6}/workflows/${workflowId}/runs/${workflowRun.id}/items`)
        } catch (err) {
            setUserVote(prevUserVote)
            setUpVotes(prevUp)
            setDownVotes(prevDown)
        }
    }, [workflowId, workflowRun, props.feedback?.id, loginUserInfo])

    const onVote = (action: VOTE_TYPE): void => {
        if (props.actionType === 'comment') {
            voteOnComment(props.comment as AiFeedbackComment, action)
        } else {
            voteOnItem(action)
        }
    }

    return (
        <div className={styles.actions}>
            <button
                type='button'
                className={styles.actionBtn}
                onClick={() => onVote(VOTE_TYPE.UPVOTE)}
            >
                {userVote === 'UPVOTE' ? <IconThumbsUpFilled /> : <IconThumbsUp />}
                <span className={styles.count}>{upVotes}</span>
            </button>

            <button
                type='button'
                className={styles.actionBtn}
                onClick={() => onVote(VOTE_TYPE.DOWNVOTE)}
            >
                {userVote === 'DOWNVOTE' ? <IconThumbsDownFilled /> : <IconThumbsDown />}
                <span className={styles.count}>{downVotes}</span>
            </button>

            {
                props.onPressReply && (
                    <button
                        type='button'
                        className={styles.actionBtn}
                        onClick={props.onPressReply}
                    >
                        <IconReply />
                        <span className={styles.count}>Reply</span>
                    </button>
                )
            }
            {
                props.onPressEdit && (loginUserInfo?.userId?.toString() === props.comment?.createdBy.toString()) && (
                    <button
                        type='button'
                        className={styles.actionBtn}
                        onClick={props.onPressEdit}
                    >
                        <IconEditReply />
                        <span className={styles.count}>Edit</span>
                    </button>
                )
            }
        </div>
    )
}
