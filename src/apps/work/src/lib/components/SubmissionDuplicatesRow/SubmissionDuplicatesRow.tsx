/**
 * Expandable duplicates row rendered under a submissions table row.
 */
import { FC, useCallback, useState } from 'react'
import classNames from 'classnames'

import { EnvironmentConfig } from '~/config'
import { IconOutline } from '~/libs/ui'

import { SubmissionDuplicate } from '../../models'

import styles from './SubmissionDuplicatesRow.module.scss'

interface SubmissionDuplicatesRowProps {
    colSpan: number
    duplicates: SubmissionDuplicate[]
}

interface DuplicateEntryProps {
    duplicate: SubmissionDuplicate
}

/**
 * Formats a duplicate's submission timestamp as `Jul 13, 7:39 AM`.
 * @param submittedAt ISO timestamp reported by the duplicates endpoint.
 * @returns Formatted timestamp, or a dash when it is missing or unparseable.
 */
function formatDuplicateDate(submittedAt?: string): string {
    if (!submittedAt) {
        return '-'
    }

    const parsed = new Date(submittedAt)
    if (Number.isNaN(parsed.getTime())) {
        return '-'
    }

    return parsed.toLocaleString('en-US', {
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        month: 'short',
    })
}

/**
 * Renders a single duplicate entry, adding the originating challenge link when
 * the match comes from a different challenge.
 */
const DuplicateEntry: FC<DuplicateEntryProps> = (props: DuplicateEntryProps) => {
    const duplicate: SubmissionDuplicate = props.duplicate
    const challengeUrl = duplicate.challenge
        ? `${EnvironmentConfig.URLS.CHALLENGES_PAGE}/${duplicate.challenge}`
        : undefined

    return (
        <div className={styles.duplicate}>
            <div className={styles.duplicateLine}>
                <span className={styles.bullet}>&bull;</span>
                <span>{duplicate.userHandle || duplicate.user || 'Unknown member'}</span>
                <span className={styles.duplicateMeta}>
                    (
                    {duplicate.submissionId}
                    )
                </span>
                <span className={styles.duplicateMeta}>
                    -
                    {' '}
                    {formatDuplicateDate(duplicate.submittedAt)}
                </span>
            </div>

            {duplicate.isCrossChallenge && (
                <div className={styles.crossChallenge}>
                    <IconOutline.LightningBoltIcon aria-hidden='true' />
                    <span>from</span>
                    {challengeUrl ? (
                        <a
                            className={styles.crossChallengeLink}
                            href={challengeUrl}
                            rel='noreferrer'
                            target='_blank'
                        >
                            {duplicate.challengeTitle || duplicate.challenge}
                            <IconOutline.ExternalLinkIcon aria-hidden='true' />
                        </a>
                    ) : (
                        <span>{duplicate.challengeTitle || 'another challenge'}</span>
                    )}
                </div>
            )}
        </div>
    )
}

/**
 * Renders the collapsed-by-default duplicates row for one submission.
 *
 * The caller must render this only when duplicates exist; the wireframe hides
 * the row entirely for submissions with no identical siblings.
 */
export const SubmissionDuplicatesRow: FC<SubmissionDuplicatesRowProps> = props => {
    const [isOpen, setIsOpen] = useState<boolean>(false)

    const toggleOpen = useCallback((): void => {
        setIsOpen(wasOpen => !wasOpen)
    }, [])

    const countLabel = `${props.duplicates.length} duplicate${props.duplicates.length === 1 ? '' : 's'}`

    return (
        <tr>
            <td className={styles.cell} colSpan={props.colSpan}>
                <button
                    aria-expanded={isOpen}
                    className={styles.toggle}
                    onClick={toggleOpen}
                    type='button'
                >
                    <IconOutline.ExclamationIcon aria-hidden='true' />
                    <span className={styles.toggleLabel}>{countLabel}</span>
                    <IconOutline.ChevronDownIcon
                        aria-hidden='true'
                        className={classNames(styles.chevron, isOpen && styles.chevronOpen)}
                    />
                </button>

                {isOpen && (
                    <div className={styles.panel}>
                        {props.duplicates.map(duplicate => (
                            <DuplicateEntry key={duplicate.submissionId} duplicate={duplicate} />
                        ))}
                    </div>
                )}
            </td>
        </tr>
    )
}

export default SubmissionDuplicatesRow
