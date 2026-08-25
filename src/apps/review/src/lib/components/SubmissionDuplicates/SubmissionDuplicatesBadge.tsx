/**
 * Warning badge shown next to a submission ID when identical submissions exist.
 */
import { FC, useContext, useMemo } from 'react'

import { IconOutline, Tooltip } from '~/libs/ui'

import { ChallengeDetailContext } from '../../contexts/ChallengeDetailContext'
import { ChallengeDetailContextModel, SubmissionDuplicate } from '../../models'

import styles from './SubmissionDuplicates.module.scss'

interface SubmissionDuplicatesBadgeProps {
    submissionId?: string
}

/**
 * Builds the tooltip summary for a set of duplicate matches.
 * @param duplicates Duplicate matches for the submission.
 * @returns Count summary, calling out cross-challenge matches when present.
 */
function getTooltipContent(duplicates: SubmissionDuplicate[]): string {
    const countLabel = `${duplicates.length} identical submission${duplicates.length === 1 ? '' : 's'}`
    const crossChallengeCount = duplicates.filter(duplicate => duplicate.isCrossChallenge).length

    if (!crossChallengeCount) {
        return `${countLabel} on this challenge`
    }

    if (crossChallengeCount === duplicates.length) {
        return `${countLabel} on other challenges`
    }

    return `${countLabel}, ${crossChallengeCount} on other challenges`
}

/**
 * Renders the duplicate-submission warning icon, or nothing when the submission
 * has no known duplicates.
 *
 * Duplicate data comes from `ChallengeDetailContext`, so the badge can be
 * dropped into any table cell without threading props through the renderer.
 */
export const SubmissionDuplicatesBadge: FC<SubmissionDuplicatesBadgeProps> = props => {
    const { duplicatesBySubmissionId }: ChallengeDetailContextModel
        = useContext(ChallengeDetailContext)

    const duplicates = useMemo<SubmissionDuplicate[]>(
        () => (props.submissionId
            ? duplicatesBySubmissionId[props.submissionId] ?? []
            : []),
        [duplicatesBySubmissionId, props.submissionId],
    )

    if (!duplicates.length) {
        return <></>
    }

    return (
        <Tooltip content={getTooltipContent(duplicates)} triggerOn='click-hover'>
            <span
                aria-label={getTooltipContent(duplicates)}
                className={styles.badge}
                role='img'
            >
                <IconOutline.ExclamationIcon aria-hidden='true' />
            </span>
        </Tooltip>
    )
}

export default SubmissionDuplicatesBadge
