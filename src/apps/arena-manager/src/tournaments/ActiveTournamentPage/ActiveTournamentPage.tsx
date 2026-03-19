import { FC, useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'

import { LoadingSpinner, PageTitle } from '~/libs/ui'

import { getActiveTournament, ActiveTournament } from '../../lib'

import styles from './ActiveTournamentPage.module.scss'

type AlertType = 'error' | 'success'

interface Alert {
    message: string
    type: AlertType
}

function formatDateTime(value?: string | null): string {
    if (!value) {
        return 'Not available'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date)
}

export const ActiveTournamentPage: FC = () => {
    const [activeTournament, setActiveTournament] = useState<ActiveTournament | null>(null)
    const [alert, setAlert] = useState<Alert | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchActiveTournament = useCallback(async () => {
        try {
            const response = await getActiveTournament()
            if (!response.success) {
                setAlert({
                    message: response.message || 'Failed to load active tournament.',
                    type: 'error',
                })
                return
            }

            setActiveTournament(response.data ?? null)
            setAlert(response.data ? null : {
                message: response.message || 'No active tournament.',
                type: 'success',
            })
        } catch (error) {
            setAlert({
                message: `Failed to load active tournament: ${(error as Error).message}`,
                type: 'error',
            })
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchActiveTournament()
        const interval = window.setInterval(() => {
            void fetchActiveTournament()
        }, 30_000)

        return () => {
            window.clearInterval(interval)
        }
    }, [fetchActiveTournament])

    return (
        <div className={styles.container}>
            <PageTitle>Active Tournament</PageTitle>

            <div className={styles.pageHeader}>
                <h3>Active Tournament</h3>
                <p className={styles.subtitle}>
                    Room links appear here once deployment succeeds and disappear after the room is closed.
                </p>
            </div>

            <div className={styles.pageContent}>
                {alert && (
                    <div
                        className={classNames(styles.alert, {
                            [styles.alertError]: alert.type === 'error',
                            [styles.alertInfo]: alert.type === 'success',
                        })}
                    >
                        {alert.message}
                    </div>
                )}

                {isLoading ? (
                    <div className={styles.spinnerWrap}>
                        <LoadingSpinner />
                    </div>
                ) : !activeTournament ? (
                    <section className={styles.card}>
                        <p className={styles.emptyText}>No active tournament.</p>
                    </section>
                ) : (
                    <>
                        <section className={styles.card}>
                            <h4 className={styles.cardTitle}>{activeTournament.name}</h4>
                            <div className={styles.metaGrid}>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Status</span>
                                    <span className={styles.metaValue}>{activeTournament.status}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Start</span>
                                    <span className={styles.metaValue}>{formatDateTime(activeTournament.startDate)}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Round Duration</span>
                                    <span className={styles.metaValue}>
                                        {activeTournament.roundDurationMinutes ?? 'N/A'} min
                                    </span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Intermission</span>
                                    <span className={styles.metaValue}>
                                        {activeTournament.intermissionMinutes ?? 'N/A'} min
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className={styles.card}>
                            <div className={styles.roundsGrid}>
                                {activeTournament.roomRounds.map(round => (
                                    <div className={styles.roundColumn} key={round.roundNumber}>
                                        <h5 className={styles.roundTitle}>{round.roundName}</h5>
                                        <div className={styles.roomList}>
                                            {round.rooms.map(room => (
                                                <div className={styles.roomCard} key={room.roomId}>
                                                    <div className={styles.roomHeading}>
                                                        Round {round.roundNumber} • Room {room.contestId.slice(0, 8)}...
                                                    </div>
                                                    <div className={styles.roomMeta}>
                                                        Problem: {room.problemName || room.problemId}
                                                    </div>
                                                    <div className={styles.roomMeta}>
                                                        Opens: {formatDateTime(room.scheduledOpenAt)}
                                                    </div>
                                                    <div className={styles.roomMeta}>
                                                        Status: {room.status}
                                                    </div>
                                                    {room.roomUrl ? (
                                                        <a className={styles.roomLink} href={room.roomUrl} rel='noreferrer' target='_blank'>
                                                            Join room
                                                        </a>
                                                    ) : (
                                                        <div className={styles.roomHint}>
                                                            Link will appear once deployment is complete.
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    )
}

export default ActiveTournamentPage
