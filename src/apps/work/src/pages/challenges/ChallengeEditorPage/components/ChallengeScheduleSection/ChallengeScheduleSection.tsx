import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useFormContext } from 'react-hook-form'

import {
    Button,
} from '~/libs/ui'

import {
    StartDateTimeInput,
} from '../../../../../lib/components/form'
import {
    CHALLENGE_TRACKS,
} from '../../../../../lib/constants'
import {
    PHASE_DURATION_MAX_HOURS,
    PHASE_DURATION_MIN_MINUTES,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    useFetchChallengePhases,
    useFetchChallengeTracks,
} from '../../../../../lib/hooks'
import { ChallengePhase } from '../../../../../lib/models'
import {
    getPhaseDuration,
    getPhaseEndDateInDate,
} from '../../../../../lib/utils'
import { PhaseEditorRow } from '../PhaseEditorRow'
import { TimelineVisualization } from '../TimelineVisualization'

import styles from './ChallengeScheduleSection.module.scss'

interface ChallengeScheduleSectionProps {
    disabled?: boolean
}

interface RecalculatePhasesResult {
    phases: ChallengePhase[]
    error?: string
}

interface RecalculatePhasesOptions {
    phaseStartOverrides?: ReadonlyMap<string, string>
}

interface ApplyPhasesOptions {
    clearStartOverrides?: boolean
    startDateOverride?: Date | string
}

function toDate(value?: Date | string | null): Date | undefined {
    if (!value) {
        return undefined
    }

    const parsedDate = value instanceof Date
        ? value
        : new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
        return undefined
    }

    return parsedDate
}

function normalizeDuration(duration: unknown): number {
    const parsedDuration = Number(duration)
    const maxDuration = PHASE_DURATION_MAX_HOURS * 60

    if (!Number.isFinite(parsedDuration)) {
        return PHASE_DURATION_MIN_MINUTES
    }

    return Math.max(
        PHASE_DURATION_MIN_MINUTES,
        Math.min(maxDuration, Math.trunc(parsedDuration)),
    )
}

function normalizePhaseName(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value
        .trim()
        .toLowerCase()
}

/**
 * Builds a stable key for phase-local UI state in the schedule editor.
 *
 * @param phase phase currently rendered.
 * @param index fallback index when ids are unavailable.
 * @returns stable string key for phase-level editor state.
 */
function getPhaseKey(
    phase: ChallengePhase,
    index: number,
): string {
    return phase.id || phase.phaseId || `${index}`
}

function canEditPhaseStartDate(
    phase: ChallengePhase,
    index: number,
    isTwoRoundDesignChallenge: boolean,
): boolean {
    const normalizedPhaseName = normalizePhaseName(phase.name)
    const isRegistrationPhase = normalizedPhaseName === 'registration'
    const isSubmissionPhase = normalizedPhaseName === 'submission'
    const isCheckpointSubmissionPhase = normalizedPhaseName === 'checkpoint submission'

    return index <= 0
        || isRegistrationPhase
        || isCheckpointSubmissionPhase
        || (isSubmissionPhase && !isTwoRoundDesignChallenge)
}

function recalculatePhases(
    phases: ChallengePhase[],
    startDateValue?: Date | string,
    options: RecalculatePhasesOptions = {},
): RecalculatePhasesResult {
    if (!phases.length) {
        return {
            phases: [],
        }
    }

    const calculatedPhases: ChallengePhase[] = []
    const calculatedByPhaseId = new Map<string, ChallengePhase>()

    const baseStartDate = toDate(startDateValue)
    const shouldScheduleDates = !!baseStartDate
    let previousPhaseEndDate = baseStartDate
    let calculationError: string | undefined

    phases.forEach((phase, index) => {
        const duration = normalizeDuration(phase.duration)
        let phaseStartDate = index === 0
            ? baseStartDate
            : previousPhaseEndDate

        if (phase.predecessor) {
            const predecessorPhase = calculatedByPhaseId.get(phase.predecessor)
            const predecessorEndDate = toDate(predecessorPhase?.scheduledEndDate)

            if (predecessorEndDate) {
                phaseStartDate = predecessorEndDate
            } else if (shouldScheduleDates && !calculationError) {
                const phaseName = phase.name || phase.phaseId || `${index + 1}`
                calculationError = `Invalid predecessor configured for phase ${phaseName}.`
            }
        }

        const overriddenStartDate = toDate(options.phaseStartOverrides?.get(getPhaseKey(phase, index)))
        if (overriddenStartDate) {
            phaseStartDate = overriddenStartDate
        }

        const phaseEndDate = phaseStartDate
            ? getPhaseEndDateInDate(phaseStartDate, duration)
            : undefined

        const nextPhase: ChallengePhase = {
            ...phase,
            duration,
            scheduledEndDate: phaseEndDate?.toISOString(),
            scheduledStartDate: phaseStartDate?.toISOString(),
        }

        calculatedPhases.push(nextPhase)

        if (nextPhase.phaseId) {
            calculatedByPhaseId.set(nextPhase.phaseId, nextPhase)
        }

        previousPhaseEndDate = phaseEndDate
    })

    return {
        error: calculationError,
        phases: calculatedPhases,
    }
}

// eslint-disable-next-line complexity
export const ChallengeScheduleSection: FC<ChallengeScheduleSectionProps> = (
    props: ChallengeScheduleSectionProps,
) => {
    const formContext = useFormContext()
    const setValue = formContext.setValue

    const challengePhaseResult = useFetchChallengePhases()
    const challengeTrackResult = useFetchChallengeTracks()
    const challengeTracks = challengeTrackResult.tracks
    const trackId = formContext.watch('trackId') as string | undefined
    const useSchedulingApi = formContext.watch('legacy.useSchedulingAPI') as boolean | undefined
    const startDate = formContext.watch('startDate') as Date | string | undefined
    const watchedPhases = formContext.watch('phases') as ChallengePhase[] | undefined
    const phases = useMemo<ChallengePhase[]>(
        () => watchedPhases || [],
        [watchedPhases],
    )
    const isSectionDisabled = !!props.disabled

    const [isGanttView, setIsGanttView] = useState<boolean>(false)
    const [calculationError, setCalculationError] = useState<string | undefined>()
    const [phaseEndDateErrors, setPhaseEndDateErrors] = useState<Record<string, string>>({})

    const currentTimezone = useMemo(
        () => Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone,
        [],
    )
    const selectedChallengeTrack = useMemo(
        () => challengeTracks.find(challengeTrack => challengeTrack.id === trackId),
        [
            challengeTracks,
            trackId,
        ],
    )
    const isDesignTrackChallenge = useMemo(
        (): boolean => {
            const normalizedTrack = (
                selectedChallengeTrack?.track
                || selectedChallengeTrack?.name
                || selectedChallengeTrack?.abbreviation
                || ''
            )
                .trim()
                .toUpperCase()

            return normalizedTrack === CHALLENGE_TRACKS.DESIGN
        },
        [selectedChallengeTrack],
    )
    const hasCheckpointSubmissionPhase = useMemo(
        (): boolean => phases.some(phase => normalizePhaseName(phase.name) === 'checkpoint submission'),
        [phases],
    )
    const isTwoRoundDesignChallenge = isDesignTrackChallenge && hasCheckpointSubmissionPhase
    const editablePhaseStartDateKeys = useMemo(
        () => {
            const editablePhaseKeys = new Set<string>()

            phases.forEach((phase, index) => {
                if (!canEditPhaseStartDate(phase, index, isTwoRoundDesignChallenge)) {
                    return
                }

                editablePhaseKeys.add(getPhaseKey(phase, index))
            })

            return editablePhaseKeys
        },
        [isTwoRoundDesignChallenge, phases],
    )

    const initializedRef = useRef<boolean>(false)
    const phaseStartOverridesRef = useRef<Map<string, string>>(new Map<string, string>())

    const prunePhaseStartOverrides = useCallback((nextPhases: ChallengePhase[]): void => {
        if (!phaseStartOverridesRef.current.size) {
            return
        }

        const validKeys = new Set(
            nextPhases.map((phase, index) => getPhaseKey(phase, index)),
        )

        Array.from(phaseStartOverridesRef.current.keys())
            .forEach(key => {
                if (!validKeys.has(key)) {
                    phaseStartOverridesRef.current.delete(key)
                }
            })
    }, [])

    const applyPhases = useCallback(
        (
            nextPhases: ChallengePhase[],
            options: ApplyPhasesOptions = {},
        ): void => {
            if (options.clearStartOverrides) {
                phaseStartOverridesRef.current.clear()
            }

            prunePhaseStartOverrides(nextPhases)

            const hasStartDateOverride = Object.prototype.hasOwnProperty.call(
                options,
                'startDateOverride',
            )
            const recalculationResult: RecalculatePhasesResult = recalculatePhases(
                nextPhases,
                hasStartDateOverride
                    ? options.startDateOverride
                    : startDate,
                {
                    phaseStartOverrides: phaseStartOverridesRef.current,
                },
            )
            const error = recalculationResult.error
            const recalculatedPhases = recalculationResult.phases

            setValue('phases', recalculatedPhases, {
                shouldDirty: true,
                shouldValidate: true,
            })

            setCalculationError(error)
            setPhaseEndDateErrors({})
        },
        [prunePhaseStartOverrides, setValue, startDate],
    )

    useEffect(() => {
        if (!phaseStartOverridesRef.current.size) {
            return
        }

        let removedOverride = false

        Array.from(phaseStartOverridesRef.current.keys())
            .forEach(key => {
                if (editablePhaseStartDateKeys.has(key)) {
                    return
                }

                phaseStartOverridesRef.current.delete(key)
                removedOverride = true
            })

        if (!removedOverride) {
            return
        }

        applyPhases(phases)
    }, [
        applyPhases,
        editablePhaseStartDateKeys,
        phases,
    ])

    useEffect(() => {
        if (useSchedulingApi === true) {
            return
        }

        setValue('legacy.useSchedulingAPI', true, {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [
        setValue,
        useSchedulingApi,
    ])

    useEffect(() => {
        if (initializedRef.current) {
            return
        }

        if (!phases.length) {
            return
        }

        const recalculationResult: RecalculatePhasesResult = recalculatePhases(phases, startDate, {
            phaseStartOverrides: phaseStartOverridesRef.current,
        })
        const error = recalculationResult.error
        const recalculatedPhases = recalculationResult.phases

        setValue('phases', recalculatedPhases, {
            shouldDirty: false,
            shouldValidate: true,
        })

        setCalculationError(error)

        initializedRef.current = true
    }, [phases, setValue, startDate])

    const handleStartDateChange = useCallback(
        (date: Date | null): void => {
            const nextStartDate = date || undefined

            setValue('startDate', nextStartDate, {
                shouldDirty: true,
                shouldValidate: true,
            })

            applyPhases(phases, {
                clearStartOverrides: true,
                startDateOverride: nextStartDate,
            })
        },
        [applyPhases, phases, setValue],
    )

    const handleDurationChange = useCallback(
        (index: number, durationMinutes: number): void => {
            const nextPhases = phases.map((phase, phaseIndex) => {
                if (phaseIndex !== index) {
                    return phase
                }

                return {
                    ...phase,
                    duration: normalizeDuration(durationMinutes),
                }
            })

            applyPhases(nextPhases)
        },
        [applyPhases, phases],
    )
    const handlePhaseStartDateChange = useCallback(
        (index: number, date: Date | null): void => {
            const nextStartDate = date || undefined

            if (!nextStartDate) {
                return
            }

            if (index === 0) {
                handleStartDateChange(nextStartDate)
                return
            }

            const phase = phases[index]
            if (!phase) {
                return
            }

            const phaseKey = getPhaseKey(phase, index)
            if (!editablePhaseStartDateKeys.has(phaseKey)) {
                return
            }

            phaseStartOverridesRef.current.set(
                phaseKey,
                nextStartDate.toISOString(),
            )

            applyPhases(phases)
        },
        [applyPhases, editablePhaseStartDateKeys, handleStartDateChange, phases],
    )
    const handlePhaseEndDateChange = useCallback(
        (index: number, date: Date | null): void => {
            const nextEndDate = date || undefined
            if (!nextEndDate) {
                return
            }

            const phase = phases[index]
            if (!phase) {
                return
            }

            const phaseKey = getPhaseKey(phase, index)
            const phaseStartDate = toDate(phase.scheduledStartDate)

            if (!phaseStartDate) {
                setPhaseEndDateErrors(previousState => ({
                    ...previousState,
                    [phaseKey]: 'Start date must be set before editing end date.',
                }))
                return
            }

            if (nextEndDate.getTime() <= phaseStartDate.getTime()) {
                setPhaseEndDateErrors(previousState => ({
                    ...previousState,
                    [phaseKey]: 'End date must be after start date.',
                }))
                return
            }

            const nextPhases = phases.map((currentPhase, phaseIndex) => {
                if (phaseIndex !== index) {
                    return currentPhase
                }

                const nextDuration = normalizeDuration(
                    getPhaseDuration(phaseStartDate, nextEndDate),
                )

                return {
                    ...currentPhase,
                    duration: nextDuration,
                }
            })

            applyPhases(nextPhases)
        },
        [applyPhases, phases],
    )

    const handleToggleView = useCallback((): void => {
        setIsGanttView(previousValue => !previousValue)
    }, [])
    const handleSetStartDateImmediately = useCallback(
        (): void => {
            handleStartDateChange(new Date())
        },
        [handleStartDateChange],
    )

    return (
        <section className={styles.container}>
            <div className={styles.grid}>
                <div className={styles.startDateField}>
                    <p className={styles.startDateTimezone}>
                        Timezone:
                        {' '}
                        {currentTimezone}
                    </p>

                    <div className={styles.startDateControls}>
                        <div className={styles.startDateInput}>
                            <StartDateTimeInput
                                disabled={isSectionDisabled}
                                label='Challenge Start Date/Time'
                                onChange={handleStartDateChange}
                                showTimezone={false}
                                value={startDate}
                            />
                        </div>
                        <Button
                            disabled={isSectionDisabled}
                            label='Immediately'
                            onClick={handleSetStartDateImmediately}
                            secondary
                            size='lg'
                        />
                    </div>
                </div>
            </div>

            <div className={styles.header}>
                <h4 className={styles.title}>Challenge Schedule</h4>
                <Button
                    disabled={isSectionDisabled || !phases.length}
                    label={isGanttView ? 'Switch to Editor View' : 'Switch to Gantt View'}
                    onClick={handleToggleView}
                    secondary
                    size='lg'
                />

            </div>

            {isGanttView
                ? (
                    <TimelineVisualization
                        challengePhases={challengePhaseResult.challengePhases}
                        phases={phases}
                        startDate={startDate}
                    />
                )
                : (
                    <div className={styles.phaseList}>
                        {phases.length
                            ? phases.map((phase, index) => (
                                <PhaseEditorRow
                                    disabled={isSectionDisabled}
                                    endDate={phase.scheduledEndDate}
                                    endDateError={phaseEndDateErrors[getPhaseKey(phase, index)]}
                                    index={index}
                                    isStartDateEditable={editablePhaseStartDateKeys.has(getPhaseKey(phase, index))}
                                    key={phase.id || phase.phaseId || `${index}`}
                                    onDurationChange={handleDurationChange}
                                    onEndDateChange={handlePhaseEndDateChange}
                                    onStartDateChange={handlePhaseStartDateChange}
                                    phase={phase}
                                    startDate={phase.scheduledStartDate}
                                />
                            ))
                            : <p className={styles.emptyText}>No schedule phases available.</p>}
                    </div>
                )}

            {calculationError
                ? (
                    <p aria-live='polite' className={styles.errorText}>
                        {calculationError}
                    </p>
                )
                : undefined}

            {challengePhaseResult.isError
                ? (
                    <p aria-live='polite' className={styles.errorText}>
                        {challengePhaseResult.error?.message || 'Unable to load challenge phases'}
                    </p>
                )
                : undefined}
        </section>
    )
}

export default ChallengeScheduleSection
