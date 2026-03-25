import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'
import { useNavigate, useParams } from 'react-router-dom'

import { Button, LoadingSpinner, PageTitle } from '~/libs/ui'

import {
    getActiveTournamentPath,
    rootRoute,
    tournamentsRouteId,
} from '../../config/routes.config'
import {
    getTournament,
    getTournamentRooms,
    publishTournament,
    Tournament,
    TournamentRoomRound,
} from '../../lib'

import styles from './TournamentLaunchPage.module.scss'

type AlertType = 'success' | 'error' | 'pending'

interface Alert {
    message: string
    type: AlertType
}

interface LaunchFormState {
    startDate: string
    startTime: string
    roundDurationMinutes: string
    intermissionMinutes: string
}

const defaultForm: LaunchFormState = {
    intermissionMinutes: '',
    roundDurationMinutes: '',
    startDate: '',
    startTime: '',
}

function toDateTimeParts(value?: string | null): Pick<LaunchFormState, 'startDate' | 'startTime'> {
    if (!value) {
        return {
            startDate: '',
            startTime: '',
        }
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return {
            startDate: '',
            startTime: '',
        }
    }

    const timezoneOffset = date.getTimezoneOffset() * 60_000
    const localIsoValue = new Date(date.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 16)

    const [startDate = '', startTime = ''] = localIsoValue.split('T')
    return { startDate, startTime }
}

function formatDateTime(value?: string | null): string {
    if (!value) {
        return 'Not scheduled'
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

function buildStartDateTime(form: LaunchFormState): string {
    if (!form.startDate || !form.startTime) {
        return ''
    }

    return `${form.startDate}T${form.startTime}`
}

export const TournamentLaunchPage: FC = () => {
    const navigate = useNavigate()
    const { tourneyId } = useParams<{ tourneyId: string }>()
    const [alert, setAlert] = useState<Alert | null>(null)
    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [roomRounds, setRoomRounds] = useState<TournamentRoomRound[]>([])
    const [form, setForm] = useState<LaunchFormState>(defaultForm)
    const [isBusy, setIsBusy] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const showAlert = useCallback((message: string, type: AlertType = 'success') => {
        setAlert({ message, type })
    }, [])

    const isPublished = tournament?.status !== 'DRAFT'

    const populateForm = useCallback((loadedTournament: Tournament) => {
        const startDateParts = loadedTournament.status === 'DRAFT'
            ? {
                startDate: '',
                startTime: '',
            }
            : toDateTimeParts(loadedTournament.startDate)

        setForm({
            intermissionMinutes: loadedTournament.intermissionMinutes?.toString() || '',
            roundDurationMinutes: loadedTournament.roundDurationMinutes?.toString() || '',
            startDate: startDateParts.startDate,
            startTime: startDateParts.startTime,
        })
    }, [])

    const fetchData = useCallback(async () => {
        if (!tourneyId) {
            showAlert('Tournament ID is required.', 'error')
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            const [tournamentResponse, roomsResponse] = await Promise.all([
                getTournament(tourneyId),
                getTournamentRooms(tourneyId),
            ])

            if (!tournamentResponse.success || !tournamentResponse.data) {
                showAlert(tournamentResponse.message || 'Failed to load tournament.', 'error')
                return
            }

            setTournament(tournamentResponse.data)
            setRoomRounds(roomsResponse.data ?? [])
            populateForm(tournamentResponse.data)
        } catch (error) {
            showAlert(`Failed to load launch data: ${(error as Error).message}`, 'error')
        } finally {
            setIsLoading(false)
        }
    }, [populateForm, showAlert, tourneyId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const roundSummary = useMemo(() => {
        if (!tournament) {
            return ''
        }

        return tournament.bracketStructure.rounds
            .map(round => `${round.roundName}: ${round.contests.length} rooms`)
            .join(' • ')
    }, [tournament])

    const handleFormChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target
        const fieldName = name as keyof LaunchFormState
        setForm(current => ({
            ...current,
            [fieldName]: value,
        }))
    }, [])

    const handlePublish = useCallback(async () => {
        if (!tourneyId || !tournament) {
            return
        }

        const startDateTime = buildStartDateTime(form)
        if (!startDateTime) {
            showAlert('Start date/time is required before publishing.', 'error')
            return
        }

        const roundDurationMinutes = Number(form.roundDurationMinutes)
        const intermissionMinutes = Number(form.intermissionMinutes)
        if (!Number.isFinite(roundDurationMinutes) || roundDurationMinutes < 1) {
            showAlert('Round duration must be at least 1 minute.', 'error')
            return
        }
        if (!Number.isFinite(intermissionMinutes) || intermissionMinutes < 0) {
            showAlert('Intermission must be 0 or greater.', 'error')
            return
        }

        setIsBusy(true)
        showAlert(`Publishing '${tournament.name}'...`, 'pending')
        try {
            const response = await publishTournament(tourneyId, {
                intermissionMinutes,
                roundDurationMinutes,
                startDateTime: new Date(startDateTime).toISOString(),
            })

            if (!response.success || !response.data) {
                showAlert(response.message || 'Failed to publish tournament.', 'error')
                return
            }

            setTournament(response.data)
            populateForm(response.data)
            showAlert('Tournament published successfully.', 'success')
            await fetchData()
        } catch (error) {
            showAlert(`Failed to publish tournament: ${(error as Error).message}`, 'error')
        } finally {
            setIsBusy(false)
        }
    }, [fetchData, form, populateForm, showAlert, tournament, tourneyId])

    return (
        <div className={styles.container}>
            <PageTitle>Launch Tournament</PageTitle>

            <div className={styles.pageHeader}>
                <div>
                    <h3>Launch Tournament</h3>
                    <p className={styles.subtitle}>
                        Configure timing and publish a saved tournament.
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <Button noCaps onClick={() => navigate(`${rootRoute}/${tournamentsRouteId}`)} secondary>
                        Back to Tournaments
                    </Button>
                    {isPublished && (
                        <Button noCaps onClick={() => navigate(getActiveTournamentPath())} primary>
                            View Active Tournament
                        </Button>
                    )}
                </div>
            </div>

            <div className={styles.pageContent}>
                {alert && (
                    <div
                        className={classNames(styles.alert, {
                            [styles.alertError]: alert.type === 'error',
                            [styles.alertPending]: alert.type === 'pending',
                            [styles.alertSuccess]: alert.type === 'success',
                        })}
                    >
                        {alert.message}
                    </div>
                )}

                {isLoading ? (
                    <div className={styles.spinnerWrap}>
                        <LoadingSpinner />
                    </div>
                ) : !tournament ? (
                    <section className={styles.card}>
                        <p className={styles.emptyText}>Tournament not found.</p>
                    </section>
                ) : (
                    <>
                        <section className={styles.card}>
                            <h4 className={styles.cardTitle}>Tournament Summary</h4>
                            <div className={styles.summaryGrid}>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Tournament</span>
                                    <span className={styles.summaryValue}>{tournament.name}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Status</span>
                                    <span className={styles.summaryValue}>{tournament.status}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Rounds</span>
                                    <span className={styles.summaryValue}>{tournament.numRounds}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Tournament ID</span>
                                    <span className={styles.summaryValue}>{tournament.tourneyId}</span>
                                </div>
                            </div>
                            <p className={styles.meta}>{roundSummary}</p>
                            {isPublished && (
                                <div className={styles.lockNotice}>
                                    This tournament is published and locked. Launch settings and bracket assignments are read-only.
                                </div>
                            )}
                        </section>

                        <section className={styles.card}>
                            <h4 className={styles.cardTitle}>Launch Settings</h4>
                            <div className={styles.formGrid}>
                                <label className={styles.field}>
                                    <span className={styles.label}>Tournament Start Date</span>
                                    <input
                                        className={styles.input}
                                        disabled={isBusy || isPublished}
                                        name='startDate'
                                        onChange={handleFormChange}
                                        type='date'
                                        value={form.startDate}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>Tournament Start Time</span>
                                    <input
                                        className={styles.input}
                                        disabled={isBusy || isPublished}
                                        name='startTime'
                                        onChange={handleFormChange}
                                        step={60}
                                        type='time'
                                        value={form.startTime}
                                    />
                                    <span className={styles.fieldHint}>Use local browser time.</span>
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>Round Duration (minutes)</span>
                                    <input
                                        className={styles.input}
                                        disabled={isBusy || isPublished}
                                        min={1}
                                        name='roundDurationMinutes'
                                        onChange={handleFormChange}
                                        type='number'
                                        value={form.roundDurationMinutes}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>Intermission (minutes)</span>
                                    <input
                                        className={styles.input}
                                        disabled={isBusy || isPublished}
                                        min={0}
                                        name='intermissionMinutes'
                                        onChange={handleFormChange}
                                        type='number'
                                        value={form.intermissionMinutes}
                                    />
                                </label>
                            </div>
                            <div className={styles.actions}>
                                <Button disabled={isBusy || isPublished} noCaps onClick={handlePublish} primary>
                                    Publish
                                </Button>
                            </div>
                        </section>

                        <section className={styles.card}>
                            <h4 className={styles.cardTitle}>Room Schedule</h4>
                            {!roomRounds.length ? (
                                <p className={styles.emptyText}>
                                    Room schedule will appear here after the tournament is published.
                                </p>
                            ) : (
                                <div className={styles.roundsGrid}>
                                    {roomRounds.map(round => (
                                        <div className={styles.roundColumn} key={round.roundNumber}>
                                            <h5 className={styles.roundTitle}>{round.roundName}</h5>
                                            <div className={styles.roomList}>
                                                {round.rooms.map(room => (
                                                    <div className={styles.roomCard} key={room.roomId}>
                                                        <div className={styles.roomTitle}>
                                                            Room {room.contestId.slice(0, 8)}...
                                                        </div>
                                                        <div className={styles.roomMeta}>Status: {room.status}</div>
                                                        <div className={styles.roomMeta}>
                                                            Problem: {room.problemName || room.problemId}
                                                        </div>
                                                        <div className={styles.roomMeta}>
                                                            Deploy: {formatDateTime(room.deployAt)}
                                                        </div>
                                                        <div className={styles.roomMeta}>
                                                            Open: {formatDateTime(room.scheduledOpenAt)}
                                                        </div>
                                                        <div className={styles.roomMeta}>
                                                            Close: {formatDateTime(room.scheduledCloseAt)}
                                                        </div>
                                                        {room.roomUrl && (
                                                            <a className={styles.roomLink} href={room.roomUrl} rel='noreferrer' target='_blank'>
                                                                Open room link
                                                            </a>
                                                        )}
                                                        {room.lastError && (
                                                            <div className={styles.errorText}>{room.lastError}</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    )
}

export default TournamentLaunchPage
