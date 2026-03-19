import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'
import { useNavigate } from 'react-router-dom'

import { Button, LoadingSpinner, PageTitle } from '~/libs/ui'

import { getTournamentLaunchPath } from '../../config/routes.config'
import { MSG_NO_PROBLEMS_FOUND, MSG_NO_TOURNAMENTS_FOUND } from '../../config/index.config'
import {
    CreateTournamentPayload,
    createTournament,
    DeleteConfirmationModal,
    deleteTournament,
    listTournaments,
    SourceProblem,
    Tournament,
    updateTournament,
    getProblems,
} from '../../lib'

import styles from './TournamentPage.module.scss'

type AlertType = 'success' | 'error' | 'pending'

interface Alert {
    message: string
    type: AlertType
}

interface TournamentFormState {
    name: string
    numRounds: string
    initialEntrants: string
    maxContestantsPerMatch: string
    advancingContestants: string
}

type DraftTournament = Omit<
    Tournament,
    | 'intermissionMinutes'
    | 'isActive'
    | 'publishedAt'
    | 'roundDurationMinutes'
    | 'startDate'
    | 'status'
    | 'tourneyId'
> & {
    intermissionMinutes?: number | null
    isActive?: boolean
    publishedAt?: string | null
    roundDurationMinutes?: number | null
    startDate?: string
    status?: string
    tourneyId?: string
}

const defaultForm: TournamentFormState = {
    advancingContestants: '',
    initialEntrants: '',
    maxContestantsPerMatch: '',
    name: '',
    numRounds: '',
}

function generateDraftTournament(config: CreateTournamentPayload): DraftTournament {
    const rounds: DraftTournament['bracketStructure']['rounds'] = []
    let currentEntrants = config.initialEntrants
    let currentRound = 1

    while (currentRound <= config.numRounds && currentEntrants > config.advancingContestants) {
        const matchesInRound = Math.ceil(currentEntrants / config.maxContestantsPerMatch)
        rounds.push({
            contests: Array.from({ length: matchesInRound }, (_, index) => ({
                contestId: `draft-${currentRound}-${index + 1}`,
                entrantIds: [],
            })),
            roundName: `Round ${currentRound} (${matchesInRound} Contests)`,
            roundNumber: currentRound,
        })
        currentEntrants = matchesInRound * config.advancingContestants
        currentRound += 1
    }

    return {
        advancingContestants: config.advancingContestants,
        bracketStructure: { rounds },
        initialEntrants: config.initialEntrants,
        maxContestantsPerMatch: config.maxContestantsPerMatch,
        name: config.name,
        numRounds: config.numRounds,
    }
}

function applyDraftProblemsToSavedTournament(
    savedTournament: Tournament,
    draftTournament: DraftTournament,
): Tournament {
    return {
        ...savedTournament,
        name: draftTournament.name,
        bracketStructure: {
            rounds: savedTournament.bracketStructure.rounds.map((savedRound, roundIndex) => {
                const draftRound = draftTournament.bracketStructure.rounds[roundIndex]
                if (!draftRound) {
                    return savedRound
                }

                return {
                    ...savedRound,
                    contests: savedRound.contests.map((savedContest, contestIndex) => {
                        const draftContest = draftRound.contests[contestIndex]
                        if (!draftContest) {
                            return savedContest
                        }

                        return {
                            ...savedContest,
                            problemId: draftContest.problemId,
                            problemName: draftContest.problemName,
                        }
                    }),
                }
            }),
        },
    }
}

function isTournamentComplete(tournament: DraftTournament): boolean {
    return tournament.bracketStructure.rounds.every(round =>
        round.contests.every(contest => Boolean(contest.problemId)),
    )
}

function getRoundSummary(tournament: Tournament): string {
    return tournament.bracketStructure.rounds
        .map(round => `R${round.roundNumber}: ${round.contests.length}`)
        .join(', ')
}

export const TournamentPage: FC = () => {
    // TODO: Enforce a specific user role here (e.g. 'arena-admin') before allowing
    // access to tournament management pages.
    const navigate = useNavigate()
    const [alert, setAlert] = useState<Alert | null>(null)
    const [form, setForm] = useState<TournamentFormState>(defaultForm)
    const [problems, setProblems] = useState<SourceProblem[]>([])
    const [tournaments, setTournaments] = useState<Tournament[]>([])
    const [currentTournament, setCurrentTournament] = useState<DraftTournament | null>(null)
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<{ tourneyId: string; name: string } | null>(null)
    const [isViewingSavedTournament, setIsViewingSavedTournament] = useState(false)
    const [isBusy, setIsBusy] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const showAlert = useCallback((message: string, type: AlertType = 'success') => {
        setAlert({ message, type })
    }, [])

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const [problemResponse, tournamentResponse] = await Promise.all([
                getProblems(),
                listTournaments(),
            ])

            setProblems(problemResponse.data ?? [])
            setTournaments(tournamentResponse.data ?? [])
        } catch (error) {
            showAlert(`Failed to load tournament data: ${(error as Error).message}`, 'error')
        } finally {
            setIsLoading(false)
        }
    }, [showAlert])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const availableProblems = useMemo(
        () => problems.filter(problem => problem.isContestReady),
        [problems],
    )
    const canSaveTournament = currentTournament !== null && isTournamentComplete(currentTournament)

    const handleFormChange = useCallback((
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const { name, value } = event.target
        const fieldName = name as keyof TournamentFormState
        setForm(current => ({
            ...current,
            [fieldName]: value,
        }))
    }, [])

    const handleCreate = useCallback(async () => {
        const name = form.name.trim()
        const numRounds = Number(form.numRounds)
        const initialEntrants = Number(form.initialEntrants)
        const maxContestantsPerMatch = Number(form.maxContestantsPerMatch)
        const advancingContestants = Number(form.advancingContestants)

        if (
            !name
            || !Number.isFinite(numRounds) || numRounds < 1
            || !Number.isFinite(initialEntrants) || initialEntrants < 2
            || !Number.isFinite(maxContestantsPerMatch) || maxContestantsPerMatch < 2
            || !Number.isFinite(advancingContestants) || advancingContestants < 1
        ) {
            showAlert('Fill all tournament fields with valid values before generating a bracket.', 'error')
            return
        }

        const payload: CreateTournamentPayload = {
            advancingContestants,
            initialEntrants,
            maxContestantsPerMatch,
            name,
            numRounds,
        }

        showAlert('Generating tournament bracket...', 'pending')
        const draftTournament = generateDraftTournament(payload)
        setCurrentTournament(draftTournament)
        setSelectedTournamentId(null)
        setIsViewingSavedTournament(false)
        setForm(defaultForm)
        showAlert(`Bracket generated for '${payload.name}'. Save to store it.`, 'success')
    }, [form, showAlert])

    const persistTournament = useCallback(async (
        tournament: DraftTournament,
        successMessage: string,
    ) => {
        if (!isTournamentComplete(tournament)) {
            showAlert('Assign a problem to every round before saving the tournament.', 'error')
            return
        }

        setIsBusy(true)
        showAlert('Saving tournament changes...', 'pending')
        try {
            let savedTournament: Tournament | null = null

            if (!tournament.tourneyId) {
                const createResponse = await createTournament({
                    advancingContestants: tournament.advancingContestants,
                    initialEntrants: tournament.initialEntrants,
                    maxContestantsPerMatch: tournament.maxContestantsPerMatch,
                    name: tournament.name,
                    numRounds: tournament.numRounds,
                })

                if (!createResponse.success || !createResponse.data) {
                    showAlert(createResponse.message || 'Failed to create tournament.', 'error')
                    return
                }

                const tournamentToSave = applyDraftProblemsToSavedTournament(
                    createResponse.data,
                    tournament,
                )

                const updateResponse = await updateTournament(
                    tournamentToSave.tourneyId,
                    tournamentToSave,
                )
                if (!updateResponse.success || !updateResponse.data) {
                    showAlert(updateResponse.message || 'Failed to save tournament.', 'error')
                    return
                }
                savedTournament = updateResponse.data
            } else {
                const response = await updateTournament(tournament.tourneyId, tournament as Tournament)
                if (!response.success || !response.data) {
                    showAlert(response.message || 'Failed to save tournament.', 'error')
                    return
                }
                savedTournament = response.data
            }

            if (!savedTournament) {
                showAlert('Failed to save tournament.', 'error')
                return
            }

            setCurrentTournament(savedTournament)
            setSelectedTournamentId(savedTournament.tourneyId)
            setIsViewingSavedTournament(true)
            showAlert(successMessage, 'success')
            await fetchData()
        } catch (error) {
            showAlert(`Failed to save tournament: ${(error as Error).message}`, 'error')
        } finally {
            setIsBusy(false)
        }
    }, [fetchData, showAlert])

    const handleRoundProblemSelection = useCallback((
        roundNumber: number,
        problemId: string,
    ) => {
        if (!currentTournament) {
            return
        }

        const problem = availableProblems.find(item => item.problemId === problemId)
        const updatedTournament: DraftTournament = {
            ...currentTournament,
            bracketStructure: {
                rounds: currentTournament.bracketStructure.rounds.map(round =>
                    round.roundNumber !== roundNumber
                        ? round
                        : {
                            ...round,
                            contests: round.contests.map(contest => ({
                                ...contest,
                                problemId,
                                problemName: problem?.problemName,
                            })),
                        },
                ),
            },
        }

        setCurrentTournament(updatedTournament)
        showAlert(
            `Problem ${problem?.problemName || problemId} assigned to Round ${roundNumber}. Save to persist changes.`,
            'success',
        )
    }, [availableProblems, currentTournament, showAlert])

    const handleViewTournament = useCallback((tournament: Tournament) => {
        setCurrentTournament(tournament)
        setSelectedTournamentId(tournament.tourneyId)
        setIsViewingSavedTournament(true)
        showAlert(`Viewing saved tournament '${tournament.name}'.`, 'success')
    }, [showAlert])

    const handleDeleteTournament = useCallback(async () => {
        if (!deleteConfirm) {
            return
        }

        const { name, tourneyId } = deleteConfirm
        setIsBusy(true)
        showAlert(`Deleting '${name}'...`, 'pending')
        try {
            const response = await deleteTournament(tourneyId)
            showAlert(response.message || `Deleted '${name}'.`, response.success ? 'success' : 'error')
            if (selectedTournamentId === tourneyId) {
                setCurrentTournament(null)
                setSelectedTournamentId(null)
                setIsViewingSavedTournament(false)
            }
            await fetchData()
        } catch (error) {
            showAlert(`Failed to delete tournament: ${(error as Error).message}`, 'error')
        } finally {
            setIsBusy(false)
            setDeleteConfirm(null)
        }
    }, [deleteConfirm, fetchData, selectedTournamentId, showAlert])

    const handleLaunchTournament = useCallback((tourneyId: string) => {
        navigate(getTournamentLaunchPath(tourneyId))
    }, [navigate])

    return (
        <div className={styles.container}>
            <PageTitle>Tournaments</PageTitle>

            <div className={styles.pageHeader}>
                <h3>Tournament Management</h3>
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

                <section className={styles.card}>
                    <h4 className={styles.cardTitle}>1. Configure Tournament</h4>

                    <div className={styles.formGrid}>
                        <label className={styles.field}>
                            <span className={styles.label}>Tournament Name</span>
                            <input className={styles.input} name='name' onChange={handleFormChange} placeholder='Sample Tourney' value={form.name} />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Rounds (N)</span>
                            <input className={styles.input} min={1} name='numRounds' onChange={handleFormChange} placeholder='3' type='number' value={form.numRounds} />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Initial Entrants (X)</span>
                            <input className={styles.input} min={2} name='initialEntrants' onChange={handleFormChange} placeholder='8' type='number' value={form.initialEntrants} />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Contestants per Match (Y)</span>
                            <input className={styles.input} min={2} name='maxContestantsPerMatch' onChange={handleFormChange} placeholder='2' type='number' value={form.maxContestantsPerMatch} />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Advancing (Z)</span>
                            <input className={styles.input} min={1} name='advancingContestants' onChange={handleFormChange} placeholder='1' type='number' value={form.advancingContestants} />
                        </label>
                    </div>

                    <div className={styles.actions}>
                        <Button disabled={isBusy} onClick={handleCreate} primary>
                            Generate Bracket
                        </Button>
                    </div>
                </section>

                <section className={styles.card}>
                    <h4 className={styles.cardTitle}>2. Bracket Structure</h4>
                    {isLoading ? (
                        <div className={styles.spinnerWrap}>
                            <LoadingSpinner />
                        </div>
                    ) : !currentTournament ? (
                        <p className={styles.emptyText}>Generate or select a tournament to view its bracket.</p>
                    ) : (
                        <>
                            {currentTournament.tourneyId && (
                                <p className={styles.meta}>Tournament ID: {currentTournament.tourneyId}</p>
                            )}
                            <div className={styles.bracketContainer}>
                                {currentTournament.bracketStructure.rounds.map(round => {
                                    const currentProblemId = round.contests[0]?.problemId || ''
                                    const currentProblemName = round.contests[0]?.problemName
                                        || round.contests[0]?.problemId
                                        || 'Not Assigned'
                                    return (
                                        <div className={styles.roundColumn} key={round.roundNumber}>
                                            <div className={styles.roundStickyHeader}>
                                                <h5 className={styles.roundTitle}>{round.roundName}</h5>
                                                {isViewingSavedTournament ? (
                                                    <div className={styles.readOnlyRoundProblem}>
                                                        <span className={styles.label}>Round Problem</span>
                                                        <div className={styles.readOnlyRoundProblemValue}>
                                                            {currentProblemName}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className={styles.field}>
                                                        <span className={styles.label}>Round Problem</span>
                                                        <select
                                                            className={styles.select}
                                                            disabled={isBusy}
                                                            onChange={event => handleRoundProblemSelection(round.roundNumber, event.target.value)}
                                                            value={currentProblemId}
                                                        >
                                                            <option value=''>
                                                                {availableProblems.length ? 'Select Problem' : MSG_NO_PROBLEMS_FOUND}
                                                            </option>
                                                            {availableProblems.map(problem => (
                                                                <option key={problem.problemId} value={problem.problemId}>
                                                                    {problem.problemName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                )}
                                            </div>
                                            <div className={styles.contestList}>
                                                {round.contests.map(contest => (
                                                    <div className={styles.contestCard} key={contest.contestId}>
                                                        {currentTournament.tourneyId && (
                                                            <div className={styles.contestName}>
                                                                Contest ID: {contest.contestId.substring(0, 8)}…
                                                            </div>
                                                        )}
                                                        <div className={styles.entrantsText}>Entrants: TBD</div>
                                                        <div className={styles.problemText}>
                                                            Problem: <span
                                                                className={classNames(
                                                                    styles.problemValue,
                                                                    {
                                                                        [styles.problemValueUnassigned]: !contest.problemName && !contest.problemId,
                                                                    },
                                                                )}
                                                            >
                                                                {contest.problemName || contest.problemId || 'Not Assigned'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            {currentTournament && !isViewingSavedTournament && (
                                <div className={styles.actions}>
                                    <Button
                                        disabled={isBusy || !canSaveTournament}
                                        onClick={() => persistTournament(currentTournament, 'Tournament changes saved.')}
                                        primary
                                    >
                                        Save Tournament Changes
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </section>

                <section className={styles.card}>
                    <h4 className={styles.cardTitle}>Saved Tournaments</h4>
                    {isLoading ? (
                        <div className={styles.spinnerWrap}>
                            <LoadingSpinner />
                        </div>
                    ) : !tournaments.length ? (
                        <p className={styles.emptyText}>{MSG_NO_TOURNAMENTS_FOUND}</p>
                    ) : (
                        <div className={styles.savedList}>
                            {tournaments.map(tournament => (
                                <div
                                    className={classNames(styles.savedItem, {
                                        [styles.savedItemActive]: tournament.tourneyId === selectedTournamentId,
                                    })}
                                    key={tournament.tourneyId}
                                >
                                    <div>
                                        <div className={styles.savedName}>{tournament.name}</div>
                                        <div className={styles.savedMetaGrid}>
                                            <div className={styles.savedMeta}>
                                                ID: {tournament.tourneyId}
                                            </div>
                                            <div className={styles.savedMeta}>
                                                {tournament.initialEntrants} entrants • {tournament.maxContestantsPerMatch}/match
                                            </div>
                                            <div className={styles.savedMeta}>
                                                {getRoundSummary(tournament)}
                                            </div>
                                            <div className={styles.savedMeta}>
                                                Status: {tournament.status}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.savedActions}>
                                        <Button noCaps onClick={() => handleViewTournament(tournament)} secondary size='sm'>
                                            View
                                        </Button>
                                        <Button noCaps onClick={() => handleLaunchTournament(tournament.tourneyId)} secondary size='sm'>
                                            Launch
                                        </Button>
                                        <Button
                                            className={styles.deleteButton}
                                            noCaps
                                            onClick={() => setDeleteConfirm({
                                                name: tournament.name,
                                                tourneyId: tournament.tourneyId,
                                            })}
                                            size='sm'
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <DeleteConfirmationModal
                open={Boolean(deleteConfirm)}
                title='Delete Tournament'
                content={(
                    <p className={styles.meta}>
                        Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
                        This action cannot be undone.
                    </p>
                )}
                confirmLabel={isBusy ? 'Deleting…' : 'Delete'}
                confirmButtonClassName={styles.deleteButton}
                isProcessing={isBusy}
                onCancel={() => setDeleteConfirm(null)}
                onConfirm={handleDeleteTournament}
            />
        </div>
    )
}

export default TournamentPage
