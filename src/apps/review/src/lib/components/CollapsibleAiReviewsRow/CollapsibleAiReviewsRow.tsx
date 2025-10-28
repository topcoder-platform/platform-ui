import { FC, useCallback, useState } from 'react'

import { IconOutline } from '~/libs/ui'

import { AiReviewsTable } from '../AiReviewsTable'

import styles from './CollapsibleAiReviewsRow.module.scss'

interface CollapsibleAiReviewsRowProps {
    aiReviewers: { aiWorkflowId: string }[]
    submissionId: string
}

const CollapsibleAiReviewsRow: FC<CollapsibleAiReviewsRowProps> = props => {
    const aiReviewersCount = props.aiReviewers.length

    const [isOpen, setIsOpen] = useState(false)

    const toggleOpen = useCallback(() => {
        setIsOpen(wasOpen => !wasOpen)
    }, [])

    return (
        <div className={styles.wrap}>
            <span className={styles.reviewersDropown} onClick={toggleOpen}>
                {aiReviewersCount}
                {' '}
                AI Reviewer
                {aiReviewersCount === 1 ? '' : 's'}
                <IconOutline.ChevronDownIcon className='icon-xl' />
            </span>
            {isOpen && (
                <div className={styles.table}>
                    <AiReviewsTable
                        reviewers={props.aiReviewers}
                        submissionId={props.submissionId}
                    />
                </div>
            )}
        </div>
    )
}

export default CollapsibleAiReviewsRow
