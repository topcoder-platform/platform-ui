import { FC, useMemo } from 'react'

import { MappingAppeal, ReviewItemInfo, ScorecardQuestion } from '../../../../../../models'

import ReviewAppeal from '../ReviewAppeal/ReviewAppeal'
import ReviewComment from '../ReviewComment/ReviewComment'
import ReviewManagerComment from '../ReviewManagerComment/ReviewManagerComment'

// import styles from './ReviewComments.module.scss'

interface ReviewCommentsProps {
    question: ScorecardQuestion
    reviewItem: ReviewItemInfo
    mappingAppeals?: MappingAppeal
}

const ReviewComments: FC<ReviewCommentsProps> = props => {
    const comments = useMemo(() => (
        (props.reviewItem.reviewItemComments || []).filter(c => c.content || c.appeal || props.mappingAppeals?.[c.id])
    ).sort((a, b) => a.sortOrder - b.sortOrder), [props.reviewItem.reviewItemComments, props.mappingAppeals])

    if (!comments.length && !props.reviewItem.managerComment) {
        return <></>
    }

    return (
        <div>
            {comments.map((comment, index) => {
                const appeal = props.mappingAppeals?.[comment.id] ?? comment.appeal
                return (
                    <div key={comment.id}>
                        <ReviewComment
                            comment={comment}
                            appeal={appeal}
                            index={index + 1}
                        />
                        {appeal && (
                            <ReviewAppeal
                                appeal={appeal}
                                reviewItem={props.reviewItem}
                                scorecardQuestion={props.question}
                            />
                        )}
                    </div>
                )
            })}
            <ReviewManagerComment
                managerComment={props.reviewItem.managerComment}
                reviewItem={props.reviewItem}
                scorecardQuestion={props.question}
            />
        </div>
    )
}

export default ReviewComments

