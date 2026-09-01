/**
 * Duplicate submission list rendered above the AI reviewers table.
 */
import { FC, MouseEventHandler, useContext, useMemo } from 'react'
import moment from 'moment'

import { EnvironmentConfig } from '~/config'
import { IconOutline } from '~/libs/ui'

import { ChallengeDetailContext } from '../../contexts/ChallengeDetailContext'
import { ChallengeDetailContextModel, SubmissionDuplicate } from '../../models'
import { TABLE_DATE_FORMAT } from '../../constants'

import styles from './SubmissionDuplicates.module.scss'

interface SubmissionDuplicatesPanelProps {
    submissionId?: string
}

interface DuplicateEntryProps {
    duplicate: SubmissionDuplicate
}

/**
 * Formats a duplicate's submission timestamp for display.
 * @param submittedAt ISO timestamp reported by the duplicates endpoint.
 * @returns Formatted date, or an em dash when the timestamp is missing or invalid.
 */
function formatSubmittedAt(submittedAt?: string): string {
    if (!submittedAt) {
        return '--'
    }

    const parsed = moment(submittedAt)

    return parsed.isValid()
        ? parsed.format(TABLE_DATE_FORMAT)
        : '--'
}

const prevenPropagation: MouseEventHandler = ev => ev.stopPropagation()

/**
 * Renders a single duplicate entry, adding the originating challenge link when
 * the match comes from a different challenge.
 * @param duplicate Duplicate match to render.
 * @returns The duplicate list item.
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
                <span className={styles.duplicateId}>
                    (
                    {duplicate.submissionId}
                    )
                </span>
                <span className={styles.duplicateId}>
                    -
                    {' '}
                    {formatSubmittedAt(duplicate.submittedAt)}
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
                            onClick={prevenPropagation}
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
 * Renders the duplicates block for a submission, or nothing when the submission
 * has no known duplicates.
 *
 * Duplicate data comes from `ChallengeDetailContext` so the panel can be dropped
 * into any expandable submission row.
 */
export const SubmissionDuplicatesPanel: FC<SubmissionDuplicatesPanelProps> = props => {
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
        <div className={styles.panel}>
            <div className={styles.panelTitle}>
                <IconOutline.ExclamationIcon aria-hidden='true' />
                <span>
                    Duplicates (
                    {duplicates.length}
                    )
                </span>
            </div>

            <div className={styles.panelBox}>
                {duplicates.map(duplicate => (
                    <DuplicateEntry key={duplicate.submissionId} duplicate={duplicate} />
                ))}
            </div>
        </div>
    )
}

export default SubmissionDuplicatesPanel
