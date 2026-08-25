/**
 * Participation history for one leaderboard member.
 */
import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { BaseModal, Table, TableColumn } from '~/libs/ui'
import { textFormatDateLocaleShortString, useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { EnvironmentConfig } from '~/config'

import { CampusLeaderboardMember, CampusParticipation } from '../../lib/models'
import {
    IconResultFailed,
    IconResultPassed,
    IconStatPassed,
    IconStatRegistered,
    IconStatSubmitted,
    IconStatWins,
    placementIcons,
    placementLabels,
} from '../../lib/assets/icons'
import { StatCard } from '../../lib/components'

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
 * Renders the outcome of a member's participation: a medal for a top three
 * placement, a pass or fail tag once the submission was reviewed.
 *
 * @param entry participation entry.
 * @returns result cell.
 */
function renderResult(entry: CampusParticipation): JSX.Element {
    const placement: number | null = entry.placement
    const Medal = placement ? placementIcons[placement] : undefined

    if (Medal) {
        return (
            <span
                aria-label={placementLabels[placement as number]}
                className={styles.result}
                role='img'
            >
                <Medal className={styles.medal} />
            </span>
        )
    }

    if (entry.passedReview) {
        return (
            <span className={styles.result}>
                <IconResultPassed className={styles.resultIcon} />
                Passed Review
            </span>
        )
    }

    if (entry.submitted) {
        return (
            <span className={styles.result}>
                <IconResultFailed className={styles.resultIcon} />
                Failed Review
            </span>
        )
    }

    return (
        <span className={styles.result}>
            {entry.challengeStatus === 'ACTIVE' ? 'Challenge is in progress' : 'No submission'}
        </span>
    )
}

export const ParticipationHistoryModal: FC<ParticipationHistoryModalProps> = props => {
    const member: CampusLeaderboardMember | undefined = props.member
    const { width: screenWidth }: WindowSize = useWindowSize()
    // five columns need more room than a tablet viewport offers, so anything
    // narrower falls back to the stacked label/value layout
    const isStacked: boolean = useMemo(() => screenWidth <= 984, [screenWidth])

    const columns = useMemo<ReadonlyArray<TableColumn<CampusParticipation>>>(() => [
        {
            columnId: 'work',
            label: 'Work',
            renderer: (entry: CampusParticipation) => {
                const challengePath
                    = `${EnvironmentConfig.REVIEW.CHALLENGE_PAGE_URL}/${encodeURIComponent(entry.challengeId)}`

                return (
                    <a
                        className={styles.workLink}
                        href={challengePath}
                        rel='noopener noreferrer'
                        target='_blank'
                        onClick={function (event: any) { event.stopPropagation() }}
                    >
                        {entry.challengeName ?? entry.challengeId}
                    </a>
                )
            },
            type: 'element',
        },
        {
            columnId: 'track',
            label: 'Track',
            propertyName: 'challengeTrack',
            type: 'text',
        },
        {
            columnId: 'registrationDate',
            label: 'Registration Date',
            renderer: (entry: CampusParticipation) => <span>{formatDate(entry.registeredAt)}</span>,
            type: 'element',
        },
        {
            columnId: 'submissionDate',
            label: 'Submission Date',
            renderer: (entry: CampusParticipation) => <span>{formatDate(entry.submittedDate)}</span>,
            type: 'element',
        },
        {
            columnId: 'result',
            label: 'Result',
            renderer: renderResult,
            type: 'element',
        },
    ], [])

    // one "Label: value" row per column, stacked into a block per challenge
    const stackedColumns = useMemo<MobileTableColumn<CampusParticipation>[][]>(
        () => columns.map(column => [
            {
                ...column,
                className: '',
                mobileType: 'label',
                renderer: () => <div>{`${column.label as string}:`}</div>,
                type: 'element',
            },
            {
                ...column,
                mobileType: 'last-value',
            },
        ] as MobileTableColumn<CampusParticipation>[]),
        [columns],
    )

    if (!member) {
        return <></>
    }

    return (
        <BaseModal
            classNames={{ modal: styles.modal }}
            onClose={props.onClose}
            open
            size='body'
            spacer={false}
            title={`${member.handle ?? member.userId} Participation History`}
        >
            <div className={styles.body}>
                <div className={styles.stats}>
                    <StatCard
                        icon={IconStatRegistered}
                        label='Registrations'
                        value={member.registrations}
                    />
                    <StatCard
                        icon={IconStatSubmitted}
                        label='Submissions'
                        value={member.submissions}
                    />
                    <StatCard
                        icon={IconStatPassed}
                        label='Passed Review'
                        value={member.passingSubmissions}
                    />
                    <StatCard
                        icon={IconStatWins}
                        label='Wins'
                        value={member.wins}
                    />
                </div>

                {isStacked ? (
                    <TableMobile
                        className={styles.stackedTable}
                        columns={stackedColumns}
                        data={member.challenges}
                    />
                ) : (
                    <Table
                        className={classNames('campus-table', styles.historyTable)}
                        columns={columns}
                        data={member.challenges}
                        disableSorting
                        removeDefaultSort
                    />
                )}
            </div>
        </BaseModal>
    )
}

export default ParticipationHistoryModal
