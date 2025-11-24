import { FC, useCallback, useState } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { AiReviewsTable } from '../AiReviewsTable'
import { BackendSubmission } from '../../models'

import styles from './CollapsibleAiReviewsRow.module.scss'

interface CollapsibleAiReviewsRowProps {
    className?: string
    defaultOpen?: boolean
    aiReviewers: { aiWorkflowId: string }[]
    submission: Pick<BackendSubmission, 'id'|'virusScan'>
}

const CollapsibleAiReviewsRow: FC<CollapsibleAiReviewsRowProps> = props => {
    const aiReviewersCount = props.aiReviewers.length + 1

    const [isOpen, setIsOpen] = useState(props.defaultOpen ?? false)

    const toggleOpen = useCallback(() => {
        setIsOpen(wasOpen => !wasOpen)
    }, [])

    return (
        <div className={classNames(props.className, styles.wrap)}>
            <span className={classNames(styles.reviewersDropown, 'trigger')} onClick={toggleOpen}>
                {aiReviewersCount}
                {' '}
                AI Reviewer
                {aiReviewersCount === 1 ? '' : 's'}
                <IconOutline.ChevronDownIcon className={classNames('icon-xl', isOpen && styles.rotated)} />
            </span>
            {isOpen && (
                <div className={classNames(styles.table, 'reviews-table')}>
                    <AiReviewsTable
                        reviewers={props.aiReviewers}
                        submission={props.submission}
                    />
                </div>
            )}
        </div>
    )
}

export default CollapsibleAiReviewsRow
