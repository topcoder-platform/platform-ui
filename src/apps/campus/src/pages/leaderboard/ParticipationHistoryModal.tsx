/**
 * Participation history for one leaderboard member.
 */
import { FC, useMemo } from 'react'

import { BaseModal, IconOutline, Table, TableColumn } from '~/libs/ui'
import { textFormatDateLocaleShortString } from '~/libs/shared'
import { EnvironmentConfig } from '~/config'

import { CampusLeaderboardMember, CampusParticipation } from '../../lib/models'

import styles from './ParticipationHistoryModal.module.scss'

interface ParticipationHistoryModalProps {
    member?: CampusLeaderboardMember
    onClose: () => void
}

/**
 * Formats an api date as a short local date.
 *
 * @param value iso date string.
 * @returns formatted date or an em dash.
 */
function formatDate(value: string | null): string {
    return (value ? textFormatDateLocaleShortString(new Date(value)) : undefined) ?? '—'
}

/**
 * Describes the outcome of a member's participation in a challenge.
 *
 * @param entry participation entry.
 * @returns human readable result.
 */
function formatPlacement(placement: number | null): string | undefined {
    if (placement === 2) {
        return '2nd place'
    }

    if (placement === 3) {
        return '3rd place'
    }

    return placement && placement > 1 ? `Place ${placement}` : undefined
}

function formatResult(entry: CampusParticipation): string {
    if (entry.won) {
        return entry.placement ? `Won (place ${entry.placement})` : 'Won'
    }

    const placement = formatPlacement(entry.placement)
    if (placement) {
        return placement
    }

    if (entry.challengeStatus !== 'COMPLETED') {
        if (entry.challengeStatus === 'ACTIVE') {
            return 'Challenge is in progress'
        }
    }

    if (entry.passedReview) {
        return 'Passed review'
    }

    if (entry.submitted) {
        return 'Did not pass review'
    }

    return 'No submission'
}

export const ParticipationHistoryModal: FC<ParticipationHistoryModalProps> = props => {
    const member: CampusLeaderboardMember | undefined = props.member

    const columns = useMemo<ReadonlyArray<TableColumn<CampusParticipation>>>(() => [
        {
            columnId: 'challenge',
            label: 'Challenge',
            renderer: (entry: CampusParticipation) => {
                const challengePath
                    = `${EnvironmentConfig.REVIEW.CHALLENGE_PAGE_URL}/${encodeURIComponent(entry.challengeId)}`

                return (
                    <div className={styles.challengeCell}>
                        <a
                            className={styles.challengeName}
                            href={challengePath}
                            rel='noopener noreferrer'
                            target='_blank'
                            onClick={function (event: any) { event.stopPropagation() }}
                        >
                            {entry.challengeName ?? entry.challengeId}
                            <IconOutline.ExternalLinkIcon className={styles.externalIcon} />
                        </a>
                        <span className={styles.challengeMeta}>
                            {[entry.challengeTrack, entry.challengeType].filter(Boolean)
                                .join(' • ')}
                        </span>
                    </div>
                )
            },
            type: 'element',
        },
        {
            columnId: 'registeredAt',
            label: 'Registered',
            renderer: (entry: CampusParticipation) => <span>{formatDate(entry.registeredAt)}</span>,
            type: 'element',
        },
        {
            columnId: 'submittedDate',
            label: 'Submitted',
            renderer: (entry: CampusParticipation) => <span>{formatDate(entry.submittedDate)}</span>,
            type: 'element',
        },
        {
            columnId: 'result',
            label: 'Result',
            renderer: (entry: CampusParticipation) => <span>{formatResult(entry)}</span>,
            type: 'element',
        },
    ], [])

    if (!member) {
        return <></>
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='body'
            title={`${member.handle ?? member.userId} — Participation History`}
        >
            <div className={styles.summary}>
                <span>
                    {`${member.registrations} registrations`}
                </span>
                <span>
                    {`${member.submissions} submissions`}
                </span>
                <span>
                    {`${member.passingSubmissions} passing`}
                </span>
                <span>
                    {`${member.wins} wins`}
                </span>
            </div>

            <Table
                columns={columns}
                data={member.challenges}
                disableSorting
                removeDefaultSort
            />
        </BaseModal>
    )
}

export default ParticipationHistoryModal
