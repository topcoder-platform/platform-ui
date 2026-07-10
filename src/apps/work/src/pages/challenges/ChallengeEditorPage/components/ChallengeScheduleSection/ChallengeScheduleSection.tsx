import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useFormContext } from 'react-hook-form'
import classNames from 'classnames'

import { Button } from '~/libs/ui'

import {
    StartDateTimeInput,
} from '../../../../../lib/components/form'
import {
    CHALLENGE_STATUS,
    CHALLENGE_TRACKS,
} from '../../../../../lib/constants'
import {
    useFetchChallengePhases,
    useFetchChallengeTracks,
} from '../../../../../lib/hooks'
import {
    ChallengeMetadata,
    ChallengePhase,
} from '../../../../../lib/models'
import {
    canChangeDuration,
    getMetadataValue,
    getPhaseDuration,
    getPhaseEndDateInDate,
    setMetadataValue,
} from '../../../../../lib/utils'
import { PhaseEditorRow } from '../PhaseEditorRow'
import {
    isAiReviewer,
} from '../ReviewersField/reviewers-field.utils'
import { TimelineVisualization } from '../TimelineVisualization'

import {
    buildSchedulePhaseRows,
    canEditPhaseStartDate,
    getPhaseKey,
    normalizeDuration,
    normalizePhaseName,
    recalculatePhases,
    toDate,
} from './ChallengeScheduleSection.utils'
import styles from './ChallengeScheduleSection.module.scss'

interface ChallengeScheduleSectionProps {
    disabled?: boolean
}

interface ApplyPhasesOptions {
    clearStartOverrides?: boolean
    resetRootPhasesToStartDate?: boolean
    startDateOverride?: Date | string
}

type StartDateMode = 'immediately' | 'scheduled'

const START_DATE_MODE: Record<'IMMEDIATELY' | 'SCHEDULED', StartDateMode> = {
    IMMEDIATELY: 'immediately',
    SCHEDULED: 'scheduled',
}
const START_DATE_MODE_METADATA_NAME = 'challengeStartMode'

/**
 * Resolves the persisted challenge start mode from metadata, falling back to
 * whether the form currently has a concrete start date.
 *
 * @param startDate challenge start date stored in the form state.
 * @param metadata challenge metadata entries stored in the form state.
 * @returns the restored start mode for the schedule editor radios.
 */
function resolveStartDateMode(
    startDate: Date | string | undefined,
    metadata: ChallengeMetadata[] | undefined,
): StartDateMode {
    const persistedStartDateMode = getMetadataValue(
        metadata,
        START_DATE_MODE_METADATA_NAME,
    )

    if (
        persistedStartDateMode === START_DATE_MODE.IMMEDIATELY
        || persistedStartDateMode === START_DATE_MODE.SCHEDULED
    ) {
        return persistedStartDateMode
    }

    return startDate
        ? START_DATE_MODE.SCHEDULED
        : START_DATE_MODE.IMMEDIATELY
}

function noopVirtualPhaseChange(): void {
    // Display-only schedule rows do not mutate persisted phase state.
}

/**
 * Returns the latest valid date from a candidate list.
 *
 * @param dates candidate date values.
 * @returns the latest date, or `undefined` when no valid date is provided.
 */
function getLatestDate(dates: Array<Date | undefined>): Date | undefined {
    return dates.reduce<Date | undefined>((latestDate, date) => {
        if (!date) {
            return latestDate
        }

        if (!latestDate || date.getTime() > latestDate.getTime()) {
            return date
        }

        return latestDate
    }, undefined)
}

/**
 * Returns the earliest valid scheduled phase start from the current schedule.
 *
 * @param phases phase rows currently stored in the challenge form.
 * @returns earliest scheduled phase start date, or `undefined` when none exist.
 */
function getEarliestPhaseStartDate(phases: ChallengePhase[]): Date | undefined {
    return phases.reduce<Date | undefined>((earliestDate, phase) => {
        const phaseStartDate = toDate(phase.scheduledStartDate)

        if (!phaseStartDate) {
            return earliestDate
        }

        if (!earliestDate || phaseStartDate.getTime() < earliestDate.getTime()) {
            return phaseStartDate
        }

        return earliestDate
    }, undefined)
}

/**
 * Resolves the minimum allowed phase end date for schedule edits.
 *
 * @param phase phase currently being edited.
 * @param phaseStartDate resolved phase start date.
 * @param isDesignTrackChallenge whether the challenge is in the Design track.
 * @param minScheduleDate current schedule floor used by the editor.
 * @param persistedScheduledEndDate phase end date captured when the editor opened.
 * @param isActiveChallenge whether the challenge is active.
 * @returns minimum allowed end date for the phase.
 */
function getMinimumPhaseEndDate(
    phase: ChallengePhase,
    phaseStartDate: Date | undefined,
    isDesignTrackChallenge: boolean,
    minScheduleDate: Date,
    persistedScheduledEndDate: Date | string | undefined,
    isActiveChallenge: boolean,
): Date | undefined {
    if ((phase.isOpen || isActiveChallenge) && !phase.actualEndDate) {
        const currentEndDate = toDate(persistedScheduledEndDate)
            || toDate(phase.scheduledEndDate)

        return getLatestDate(
            isDesignTrackChallenge
                ? [
                    phaseStartDate,
                    minScheduleDate,
                ]
                : [
                    currentEndDate,
                    phaseStartDate,
                    minScheduleDate,
                ],
        )
    }

    return phaseStartDate || minScheduleDate
}

/**
 * Resolves the validation message for edits before the phase end-date minimum.
 *
 * @param phase phase currently being edited.
 * @param isDesignTrackChallenge whether the challenge is in the Design track.
 * @param isActiveChallenge whether the challenge is active.
 * @returns validation message shown below the phase end-date control.
 */
function getMinimumPhaseEndDateError(
    phase: ChallengePhase,
    isDesignTrackChallenge: boolean,
    isActiveChallenge: boolean,
): string {
    if ((phase.isOpen || isActiveChallenge) && isDesignTrackChallenge) {
        return 'End date must be at or after the current date/time.'
    }

    if (phase.isOpen || isActiveChallenge) {
        return 'Active phase end date cannot be shortened for this track.'
    }

    return 'End date must be after start date.'
}

/**
 * Builds a display-only copy of a completed phase using actual phase dates.
 *
 * @param phase phase currently rendered.
 * @returns phase values for the schedule row display.
 */
function getDisplayPhase(phase: ChallengePhase): ChallengePhase {
    const actualEndDate = toDate(phase.actualEndDate)

    if (!actualEndDate) {
        return phase
    }

    const actualStartDate = toDate(phase.actualStartDate)
    const scheduledStartDate = toDate(phase.scheduledStartDate)
    const displayStartDate = actualStartDate || scheduledStartDate
    const displayDuration = displayStartDate
        ? getPhaseDuration(displayStartDate, actualEndDate)
        : phase.duration

    return {
        ...phase,
        duration: displayDuration,
        scheduledEndDate: actualEndDate.toISOString(),
        scheduledStartDate: displayStartDate?.toISOString() || phase.scheduledStartDate,
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
    const challengeStatus = formContext.watch('status') as string | undefined
    const useSchedulingApi = formContext.watch('legacy.useSchedulingAPI') as boolean | undefined
    const metadata = formContext.watch('metadata') as ChallengeMetadata[] | undefined
    const startDate = formContext.watch('startDate') as Date | string | undefined
    const watchedPhases = formContext.watch('phases') as ChallengePhase[] | undefined
    const watchedReviewers = formContext.watch('reviewers') as {
        aiWorkflowId?: string
        isMemberReview?: boolean
    }[] | undefined
    const phases = useMemo<ChallengePhase[]>(
        () => watchedPhases || [],
        [watchedPhases],
    )
    const hasAiReviewers = useMemo(
        () => Array.isArray(watchedReviewers) && watchedReviewers.some(reviewer => isAiReviewer(reviewer)),
        [watchedReviewers],
    )
    const scheduleRows = useMemo(
        () => buildSchedulePhaseRows(phases, hasAiReviewers),
        [hasAiReviewers, phases],
    )
    const isSectionDisabled = !!props.disabled
    const showViewToggle = isSectionDisabled
    const isViewToggleDisabled = !phases.length

    const [isGanttView, setIsGanttView] = useState<boolean>(false)
    const [startDateMode, setStartDateMode] = useState<StartDateMode>(
        () => resolveStartDateMode(startDate, metadata),
    )
    const [calculationError, setCalculationError] = useState<string | undefined>()
    const [phaseEndDateErrors, setPhaseEndDateErrors] = useState<Record<string, string>>({})
    const minScheduleDate = useMemo(() => new Date(), [])

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
    const isActiveChallenge = useMemo(
        (): boolean => challengeStatus?.trim()
            .toUpperCase() === CHALLENGE_STATUS.ACTIVE,
        [challengeStatus],
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
    const lastInternalStartDateValueRef = useRef<number | 'empty' | undefined>()
    const initialPhaseEndDatesRef = useRef<Map<string, string>>(new Map<string, string>())
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

    useEffect(() => {
        phases.forEach((phase, index) => {
            const phaseKey = getPhaseKey(phase, index)
            if (initialPhaseEndDatesRef.current.has(phaseKey)) {
                return
            }

            const scheduledEndDate = toDate(phase.scheduledEndDate)
            if (scheduledEndDate) {
                initialPhaseEndDatesRef.current.set(phaseKey, scheduledEndDate.toISOString())
            }
        })
    }, [phases])

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
            const recalculationResult = recalculatePhases(
                nextPhases,
                hasStartDateOverride
                    ? options.startDateOverride
                    : startDate,
                {
                    phaseStartOverrides: phaseStartOverridesRef.current,
                    resetRootPhasesToStartDate: options.resetRootPhasesToStartDate,
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

        const parsedStartDate = toDate(startDate)
        const earliestPhaseStartDate = getEarliestPhaseStartDate(phases)
        const seededStartDate = parsedStartDate
            || earliestPhaseStartDate
            || minScheduleDate
        const recalculationStartDate = parsedStartDate
            || (
                earliestPhaseStartDate
                    ? undefined
                    : seededStartDate
            )
        const persistedStartDateMode = getMetadataValue(
            metadata,
            START_DATE_MODE_METADATA_NAME,
        )

        if (!parsedStartDate) {
            lastInternalStartDateValueRef.current = seededStartDate.getTime()
            setValue('startDate', seededStartDate, {
                shouldDirty: false,
                shouldValidate: true,
            })

            if (persistedStartDateMode !== startDateMode) {
                setValue(
                    'metadata',
                    setMetadataValue(
                        metadata,
                        START_DATE_MODE_METADATA_NAME,
                        startDateMode,
                    ),
                    {
                        shouldDirty: false,
                        shouldValidate: true,
                    },
                )
            }
        }

        const recalculationResult = recalculatePhases(phases, recalculationStartDate, {
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
    }, [
        metadata,
        minScheduleDate,
        phases,
        setValue,
        startDate,
        startDateMode,
    ])

    const handleStartDateChange = useCallback(
        (
            date: Date | null,
            nextMode: StartDateMode = START_DATE_MODE.SCHEDULED,
        ): void => {
            const nextStartDate = date || undefined

            lastInternalStartDateValueRef.current = nextStartDate
                ? nextStartDate.getTime()
                : 'empty'
            setStartDateMode(nextMode)
            setValue(
                'metadata',
                setMetadataValue(
                    metadata,
                    START_DATE_MODE_METADATA_NAME,
                    nextMode,
                ),
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            )
            setValue('startDate', nextStartDate, {
                shouldDirty: true,
                shouldValidate: true,
            })

            applyPhases(phases, {
                clearStartOverrides: true,
                resetRootPhasesToStartDate: true,
                startDateOverride: nextStartDate,
            })
        },
        [
            applyPhases,
            metadata,
            phases,
            setStartDateMode,
            setValue,
        ],
    )

    useEffect(() => {
        const parsedStartDate = toDate(startDate)
        const currentStartDateValue = parsedStartDate
            ? parsedStartDate.getTime()
            : 'empty'

        if (lastInternalStartDateValueRef.current === currentStartDateValue) {
            lastInternalStartDateValueRef.current = undefined
            return
        }

        lastInternalStartDateValueRef.current = undefined
        setStartDateMode(resolveStartDateMode(startDate, metadata))
    }, [metadata, startDate])

    const handleDurationChange = useCallback(
        (index: number, durationMinutes: number): void => {
            const phase = phases[index]
            if (!phase) {
                return
            }

            const phaseKey = getPhaseKey(phase, index)
            const phaseStartDate = toDate(phase.scheduledStartDate)
            const nextDuration = normalizeDuration(durationMinutes)
            const nextEndDate = phaseStartDate
                ? getPhaseEndDateInDate(phaseStartDate, nextDuration)
                : undefined
            const persistedScheduledEndDate = initialPhaseEndDatesRef.current.get(phaseKey)
            const minimumEndDate = getMinimumPhaseEndDate(
                phase,
                phaseStartDate,
                isDesignTrackChallenge,
                minScheduleDate,
                persistedScheduledEndDate,
                isActiveChallenge,
            )

            if (
                minimumEndDate
                && nextEndDate
                && nextEndDate.getTime() < minimumEndDate.getTime()
            ) {
                setPhaseEndDateErrors(previousState => ({
                    ...previousState,
                    [phaseKey]: getMinimumPhaseEndDateError(
                        phase,
                        isDesignTrackChallenge,
                        isActiveChallenge,
                    ),
                }))
                return
            }

            setPhaseEndDateErrors(previousState => {
                const nextState = { ...previousState }
                delete nextState[phaseKey]
                return nextState
            })

            const nextPhases = phases.map((currentPhase, phaseIndex) => {
                if (phaseIndex !== index) {
                    return currentPhase
                }

                return {
                    ...currentPhase,
                    duration: nextDuration,
                    scheduledEndDate: nextEndDate?.toISOString() || currentPhase.scheduledEndDate,
                }
            })

            applyPhases(nextPhases)
        },
        [
            applyPhases,
            isActiveChallenge,
            isDesignTrackChallenge,
            minScheduleDate,
            phases,
        ],
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
            const persistedScheduledEndDate = initialPhaseEndDatesRef.current.get(phaseKey)

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

            const minimumEndDate = getMinimumPhaseEndDate(
                phase,
                phaseStartDate,
                isDesignTrackChallenge,
                minScheduleDate,
                persistedScheduledEndDate,
                isActiveChallenge,
            )
            if (
                minimumEndDate
                && nextEndDate.getTime() < minimumEndDate.getTime()
            ) {
                setPhaseEndDateErrors(previousState => ({
                    ...previousState,
                    [phaseKey]: getMinimumPhaseEndDateError(
                        phase,
                        isDesignTrackChallenge,
                        isActiveChallenge,
                    ),
                }))
                return
            }

            setPhaseEndDateErrors(previousState => {
                const nextState = { ...previousState }
                delete nextState[phaseKey]
                return nextState
            })

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
                    scheduledEndDate: nextEndDate.toISOString(),
                }
            })

            applyPhases(nextPhases)
        },
        [
            applyPhases,
            isActiveChallenge,
            isDesignTrackChallenge,
            minScheduleDate,
            phases,
        ],
    )

    const handleStartDateModeChange = useCallback(
        (nextMode: StartDateMode): void => {
            if (nextMode === START_DATE_MODE.IMMEDIATELY) {
                handleStartDateChange(
                    new Date(),
                    START_DATE_MODE.IMMEDIATELY,
                )
                return
            }

            if (!toDate(startDate)) {
                handleStartDateChange(
                    new Date(),
                    START_DATE_MODE.SCHEDULED,
                )
                return
            }

            setStartDateMode(START_DATE_MODE.SCHEDULED)
            setValue(
                'metadata',
                setMetadataValue(
                    metadata,
                    START_DATE_MODE_METADATA_NAME,
                    START_DATE_MODE.SCHEDULED,
                ),
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            )
        },
        [handleStartDateChange, metadata, setValue, startDate],
    )
    const handleSetScheduledStartDateMode = useCallback(
        (): void => {
            handleStartDateModeChange(START_DATE_MODE.SCHEDULED)
        },
        [handleStartDateModeChange],
    )
    const handleSetImmediateStartDateMode = useCallback(
        (): void => {
            handleStartDateModeChange(START_DATE_MODE.IMMEDIATELY)
        },
        [handleStartDateModeChange],
    )
    const handleToggleView = useCallback((): void => {
        if (isViewToggleDisabled) {
            return
        }

        setIsGanttView(previousValue => !previousValue)
    }, [isViewToggleDisabled])

    useEffect(() => {
        if (showViewToggle && !isViewToggleDisabled) {
            return
        }

        setIsGanttView(false)
    }, [
        isViewToggleDisabled,
        showViewToggle,
    ])

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
                        <div className={styles.startDateHeader}>
                            <span className={styles.startDateLabel}>Start Date</span>

                            <div
                                aria-label='Challenge start mode'
                                className={styles.startDateModeGroup}
                                role='radiogroup'
                            >
                                <label
                                    className={classNames(
                                        styles.startDateModeOption,
                                        {
                                            [styles.startDateModeOptionDisabled]: isSectionDisabled,
                                            [styles.startDateModeOptionSelected]:
                                                startDateMode === START_DATE_MODE.SCHEDULED,
                                        },
                                    )}
                                    htmlFor='challenge-start-mode-scheduled'
                                >
                                    <input
                                        checked={startDateMode === START_DATE_MODE.SCHEDULED}
                                        className={styles.startDateModeRadio}
                                        disabled={isSectionDisabled}
                                        id='challenge-start-mode-scheduled'
                                        name='challenge-start-mode'
                                        onChange={handleSetScheduledStartDateMode}
                                        type='radio'
                                    />
                                    <span>Scheduled</span>
                                </label>

                                <label
                                    className={classNames(
                                        styles.startDateModeOption,
                                        {
                                            [styles.startDateModeOptionDisabled]: isSectionDisabled,
                                            [styles.startDateModeOptionSelected]:
                                                startDateMode === START_DATE_MODE.IMMEDIATELY,
                                        },
                                    )}
                                    htmlFor='challenge-start-mode-immediately'
                                >
                                    <input
                                        checked={startDateMode === START_DATE_MODE.IMMEDIATELY}
                                        className={styles.startDateModeRadio}
                                        disabled={isSectionDisabled}
                                        id='challenge-start-mode-immediately'
                                        name='challenge-start-mode'
                                        onChange={handleSetImmediateStartDateMode}
                                        type='radio'
                                    />
                                    <span>Immediately</span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.startDateInput}>
                            <StartDateTimeInput
                                disabled={isSectionDisabled || startDateMode === START_DATE_MODE.IMMEDIATELY}
                                label=''
                                labelOutside
                                minDate={minScheduleDate}
                                onChange={handleStartDateChange}
                                showTimezone={false}
                                value={startDate}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.header}>
                <h4 className={styles.title}>Challenge Schedule</h4>
                {showViewToggle
                    ? (
                        <Button
                            disabled={isViewToggleDisabled}
                            label={isGanttView ? 'Switch to Editor View' : 'Switch to Gantt View'}
                            onClick={handleToggleView}
                            secondary
                            size='lg'
                        />
                    )
                    : undefined}
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
                        {scheduleRows.length
                            ? scheduleRows.map(row => {
                                if (row.isVirtual) {
                                    return (
                                        <PhaseEditorRow
                                            disabled
                                            index={row.actualIndex}
                                            isVirtual
                                            key={row.key}
                                            onDurationChange={noopVirtualPhaseChange}
                                            onEndDateChange={noopVirtualPhaseChange}
                                            onStartDateChange={noopVirtualPhaseChange}
                                            phase={row.phase}
                                        />
                                    )
                                }

                                const phase = row.phase
                                const index = row.actualIndex
                                const phaseStartDate = toDate(phase.scheduledStartDate)
                                const isDurationEditable = canChangeDuration(phase)
                                const phaseKey = getPhaseKey(phase, index)
                                const displayPhase = getDisplayPhase(phase)

                                return (
                                    <PhaseEditorRow
                                        disabled={isSectionDisabled}
                                        endDate={displayPhase.scheduledEndDate}
                                        endDateError={phaseEndDateErrors[phaseKey]}
                                        isDurationEditable={isDurationEditable}
                                        isEndDateEditable={isDurationEditable}
                                        index={index}
                                        isStartDateEditable={editablePhaseStartDateKeys.has(
                                            phaseKey,
                                        )}
                                        key={phase.id || phase.phaseId || `${index}`}
                                        minEndDate={getMinimumPhaseEndDate(
                                            phase,
                                            phaseStartDate,
                                            isDesignTrackChallenge,
                                            minScheduleDate,
                                            initialPhaseEndDatesRef.current.get(phaseKey),
                                            isActiveChallenge,
                                        )}
                                        minStartDate={minScheduleDate}
                                        onDurationChange={handleDurationChange}
                                        onEndDateChange={handlePhaseEndDateChange}
                                        onStartDateChange={handlePhaseStartDateChange}
                                        phase={displayPhase}
                                        startDate={displayPhase.scheduledStartDate}
                                    />
                                )
                            })
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
