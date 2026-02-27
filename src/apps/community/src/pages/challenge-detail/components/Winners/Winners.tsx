import { FC, useMemo } from 'react'

import { EnvironmentConfig } from '~/config'

import type { BackendChallengeWinner } from '../../../../lib/models/BackendChallengeInfo.model'
import type { SubmissionInfo } from '../../../../lib/models/SubmissionInfo.model'
import type { PlacementPrize } from '../../../../lib/utils/challenge-detail.utils'

import styles from './Winners.module.scss'

interface WinnersProps {
    isDesign: boolean
    isLoggedIn: boolean
    isMM: boolean
    prizes: PlacementPrize[]
    submissions: SubmissionInfo[]
    viewable: boolean
    winners: BackendChallengeWinner[]
}

interface WinnerRow {
    prize: PlacementPrize | undefined
    submissionId?: string
    winner: BackendChallengeWinner
}

function formatOrdinal(placement: number | undefined): string {
    if (!placement) {
        return '-'
    }

    if (placement === 1) {
        return '1st'
    }

    if (placement === 2) {
        return '2nd'
    }

    if (placement === 3) {
        return '3rd'
    }

    return `${placement}th`
}

function getSubmissionIdByPlacement(
    submissions: SubmissionInfo[],
    placement: number | undefined,
): string | undefined {
    if (!placement) {
        return undefined
    }

    const match = submissions.find(submission => {
        const row = submission as SubmissionInfo & {
            placement?: number
            submissionId?: string
        }

        return row.placement === placement
    }) as (SubmissionInfo & { submissionId?: string }) | undefined

    return match?.submissionId ?? match?.id
}

function formatPrize(prize: PlacementPrize | undefined): string {
    if (!prize) {
        return 'N/A'
    }

    if (prize.type === 'POINT') {
        return `${prize.value.toLocaleString('en-US')}`
    }

    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 0,
        style: 'currency',
    })
        .format(prize.value)
}

/**
 * Renders winner placement rows with handles and prize amounts.
 *
 * @param props Winners data and prize context.
 * @returns Winners tab content.
 */
const Winners: FC<WinnersProps> = (props: WinnersProps) => {
    const hideDownloadForMMRDM = true
    const canShowDownloadAll = !hideDownloadForMMRDM
        && props.isMM
        && props.isLoggedIn
        && props.winners.length > 0

    const rows = useMemo<WinnerRow[]>(() => props.winners.map(winner => {
        const prize = props.prizes[(winner.placement ?? 1) - 1]
        const submissionId = props.viewable
            ? getSubmissionIdByPlacement(props.submissions, winner.placement)
            : undefined

        return {
            prize,
            submissionId,
            winner,
        }
    }), [props.prizes, props.submissions, props.viewable, props.winners])

    if (!rows.length) {
        return (
            <div className={styles.emptyState}>
                Winners will appear here once announced.
            </div>
        )
    }

    return (
        <section className={styles.container}>
            {canShowDownloadAll && (
                <div className={styles.downloadWrap}>
                    <button className={styles.downloadButton} type='button'>
                        Download All
                    </button>
                </div>
            )}

            <div className={styles.table} role='table'>
                {rows.map((row: WinnerRow) => (
                    <div
                        className={styles.row}
                        key={`${row.winner.handle ?? 'winner'}-${row.winner.placement ?? 0}`}
                        role='row'
                    >
                        <div className={styles.colPlacement} role='cell'>
                            {formatOrdinal(row.winner.placement)}
                        </div>
                        <div className={styles.colHandle} role='cell'>
                            {row.winner.handle ? (
                                <a
                                    href={`${EnvironmentConfig.TOPCODER_URL}/members/${row.winner.handle}`}
                                    rel='noreferrer'
                                    target={props.isDesign ? '_self' : '_blank'}
                                >
                                    {row.winner.handle}
                                </a>
                            ) : '-'}
                            {row.submissionId && (
                                <span className={styles.submission}>
                                    #
                                    {row.submissionId}
                                </span>
                            )}
                        </div>
                        <div className={styles.colPrize} role='cell'>
                            {formatPrize(row.prize)}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Winners
