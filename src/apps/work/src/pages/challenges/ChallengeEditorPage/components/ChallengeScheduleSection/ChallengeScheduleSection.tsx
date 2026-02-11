import {
    ChangeEvent,
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
    InputCheckbox,
} from '~/libs/ui'

import {
    FormFieldWrapper,
    StartDateTimeInput,
} from '../../../../../lib/components/form'
import { PHASE_STATUS } from '../../../../../lib/constants'
import {
    PHASE_DURATION_MAX_HOURS,
    PHASE_DURATION_MIN_MINUTES,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    useFetchChallengePhases,
    useFetchTimelineTemplates,
} from '../../../../../lib/hooks'
import { ChallengePhase } from '../../../../../lib/models'
import { getPhaseEndDateInDate } from '../../../../../lib/utils'
import { PhaseEditorRow } from '../PhaseEditorRow'
import { TimelineTemplateField } from '../TimelineTemplateField'
import { TimelineVisualization } from '../TimelineVisualization'

import styles from './ChallengeScheduleSection.module.scss'

interface ChallengeScheduleSectionProps {
    disabled?: boolean
}

interface RecalculatePhasesResult {
    phases: ChallengePhase[]
    error?: string
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

function parsePositiveInteger(value: string): number | undefined {
    if (!value.trim()) {
        return undefined
    }

    const parsedValue = Number(value)
    if (!Number.isFinite(parsedValue)) {
        return undefined
    }

    const normalizedValue = Math.trunc(parsedValue)
    return normalizedValue > 0
        ? normalizedValue
        : undefined
}

function recalculatePhases(
    phases: ChallengePhase[],
    startDateValue?: Date | string,
): RecalculatePhasesResult {
    if (!phases.length) {
        return {
            phases: [],
        }
    }

    const calculatedPhases: ChallengePhase[] = []
    const calculatedByPhaseId = new Map<string, ChallengePhase>()

    const baseStartDate = toDate(startDateValue) || new Date()
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
            } else if (!calculationError) {
                const phaseName = phase.name || phase.phaseId || `${index + 1}`
                calculationError = `Invalid predecessor configured for phase ${phaseName}.`
            }
        }

        const phaseEndDate = getPhaseEndDateInDate(phaseStartDate, duration)

        const nextPhase: ChallengePhase = {
            ...phase,
            duration,
            scheduledEndDate: phaseEndDate.toISOString(),
            scheduledStartDate: phaseStartDate.toISOString(),
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
    const timelineTemplateResult = useFetchTimelineTemplates()

    const useSchedulingApi = formContext.watch('legacy.useSchedulingAPI') as boolean | undefined
    const timelineTemplateId = formContext.watch('timelineTemplateId') as string | undefined
    const startDate = formContext.watch('startDate') as Date | string | undefined
    const milestoneEnabled = formContext.watch('milestoneConfiguration.enabled') as boolean | undefined
    const milestoneCount = formContext.watch('milestoneConfiguration.milestoneCount') as number | undefined
    const milestoneDurationDays = formContext.watch(
        'milestoneConfiguration.milestoneDurationDays',
    ) as number | undefined
    const watchedPhases = formContext.watch('phases') as ChallengePhase[] | undefined
    const phases = useMemo<ChallengePhase[]>(
        () => watchedPhases || [],
        [watchedPhases],
    )
    const isSchedulingApiEnabled = useSchedulingApi !== false
    const isSectionDisabled = !!props.disabled

    const [isGanttView, setIsGanttView] = useState<boolean>(false)
    const [calculationError, setCalculationError] = useState<string | undefined>()
    const [phaseMessage, setPhaseMessage] = useState<string | undefined>()

    const currentTimezone = useMemo(
        () => Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone,
        [],
    )

    const selectedTimelineTemplate = useMemo(
        () => timelineTemplateResult.timelineTemplates
            .find(template => template.id === timelineTemplateId),
        [timelineTemplateId, timelineTemplateResult.timelineTemplates],
    )

    const initializedRef = useRef<boolean>(false)
    const appliedTemplateIdRef = useRef<string | undefined>()
    const savedPhasesRef = useRef<ChallengePhase[]>([])

    const applyPhases = useCallback(
        (
            nextPhases: ChallengePhase[],
            options: {
                saveSnapshot?: boolean
                startDateOverride?: Date | string
            } = {},
        ): void => {
            const recalculationResult: RecalculatePhasesResult = recalculatePhases(
                nextPhases,
                options.startDateOverride || startDate,
            )
            const error = recalculationResult.error
            const recalculatedPhases = recalculationResult.phases

            setValue('phases', recalculatedPhases, {
                shouldDirty: true,
                shouldValidate: true,
            })

            setCalculationError(error)

            if (options.saveSnapshot) {
                savedPhasesRef.current = recalculatedPhases
            }
        },
        [setValue, startDate],
    )

    useEffect(() => {
        if (initializedRef.current) {
            return
        }

        if (!phases.length) {
            return
        }

        const recalculationResult: RecalculatePhasesResult = recalculatePhases(phases, startDate)
        const error = recalculationResult.error
        const recalculatedPhases = recalculationResult.phases

        setValue('phases', recalculatedPhases, {
            shouldDirty: false,
            shouldValidate: true,
        })

        savedPhasesRef.current = recalculatedPhases
        setCalculationError(error)

        initializedRef.current = true
    }, [phases, setValue, startDate])

    useEffect(() => {
        if (!timelineTemplateId) {
            appliedTemplateIdRef.current = undefined
            return
        }

        if (!isSchedulingApiEnabled) {
            return
        }

        if (!selectedTimelineTemplate || appliedTemplateIdRef.current === timelineTemplateId) {
            return
        }

        const templatePhases: ChallengePhase[] = selectedTimelineTemplate.phases
            .filter(phase => phase.isActive)
            .map(phase => ({
                duration: normalizeDuration(phase.duration),
                isOpen: false,
                name: phase.name,
                phaseId: phase.phaseId,
                predecessor: phase.predecessor,
                status: PHASE_STATUS.SCHEDULED,
            }))

        applyPhases(templatePhases, {
            saveSnapshot: true,
        })

        appliedTemplateIdRef.current = timelineTemplateId
        setPhaseMessage('Template phases loaded.')
    }, [
        applyPhases,
        isSchedulingApiEnabled,
        selectedTimelineTemplate,
        timelineTemplateId,
    ])

    useEffect(() => {
        if (isSchedulingApiEnabled || !milestoneEnabled) {
            return
        }

        setValue('milestoneConfiguration.enabled', false, {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [isSchedulingApiEnabled, milestoneEnabled, setValue])

    const handleSchedulingToggle = useCallback((): void => {
        const nextValue = !isSchedulingApiEnabled

        setValue('legacy.useSchedulingAPI', nextValue, {
            shouldDirty: true,
            shouldValidate: true,
        })

        setPhaseMessage(undefined)
    }, [isSchedulingApiEnabled, setValue])

    const handleMilestoneToggle = useCallback((): void => {
        const nextEnabled = !milestoneEnabled

        setValue('milestoneConfiguration.enabled', nextEnabled, {
            shouldDirty: true,
            shouldValidate: true,
        })

        if (!nextEnabled) {
            setValue('milestoneConfiguration.milestoneCount', undefined, {
                shouldDirty: true,
                shouldValidate: true,
            })
            setValue('milestoneConfiguration.milestoneDurationDays', undefined, {
                shouldDirty: true,
                shouldValidate: true,
            })
        }
    }, [milestoneEnabled, setValue])

    const handleMilestoneCountChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            const parsedValue = parsePositiveInteger(event.target.value)

            setValue('milestoneConfiguration.milestoneCount', parsedValue, {
                shouldDirty: true,
                shouldValidate: true,
            })
        },
        [setValue],
    )

    const handleMilestoneDurationChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            const parsedValue = parsePositiveInteger(event.target.value)

            setValue('milestoneConfiguration.milestoneDurationDays', parsedValue, {
                shouldDirty: true,
                shouldValidate: true,
            })
        },
        [setValue],
    )

    const handleStartDateChange = useCallback(
        (date: Date | null): void => {
            const nextStartDate = date || undefined

            setValue('startDate', nextStartDate, {
                shouldDirty: true,
                shouldValidate: true,
            })

            applyPhases(phases, {
                startDateOverride: nextStartDate,
            })

            setPhaseMessage(undefined)
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
            setPhaseMessage(undefined)
        },
        [applyPhases, phases],
    )

    const handleDeletePhase = useCallback(
        (index: number): void => {
            const nextPhases = phases.filter((_, phaseIndex) => phaseIndex !== index)

            applyPhases(nextPhases)
            setPhaseMessage(undefined)
        },
        [applyPhases, phases],
    )

    const handleAddPhase = useCallback((): void => {
        const usedPhaseIds = new Set(
            phases
                .map(phase => phase.phaseId)
                .filter((phaseId): phaseId is string => !!phaseId),
        )

        const availableDefinitions = challengePhaseResult.challengePhases
            .filter(phaseDefinition => phaseDefinition.isActive)
            .filter(phaseDefinition => !usedPhaseIds.has(phaseDefinition.id))

        const selectedDefinition = availableDefinitions[0]
        if (!selectedDefinition) {
            setPhaseMessage('All active phase definitions are already included.')
            return
        }

        const previousPhase = phases[phases.length - 1]

        const nextPhase: ChallengePhase = {
            duration: PHASE_DURATION_MIN_MINUTES,
            isOpen: false,
            name: selectedDefinition.name,
            phaseId: selectedDefinition.id,
            predecessor: previousPhase?.phaseId,
            status: PHASE_STATUS.SCHEDULED,
        }

        applyPhases([
            ...phases,
            nextPhase,
        ])

        setPhaseMessage(undefined)
    }, [
        applyPhases,
        challengePhaseResult.challengePhases,
        phases,
    ])

    const handleSavePhases = useCallback((): void => {
        applyPhases(phases, {
            saveSnapshot: true,
        })

        setPhaseMessage('Phases saved.')
    }, [applyPhases, phases])

    const handleResetPhases = useCallback((): void => {
        if (!savedPhasesRef.current.length) {
            return
        }

        const recalculationResult: RecalculatePhasesResult = recalculatePhases(
            savedPhasesRef.current,
            startDate,
        )
        const error = recalculationResult.error
        const recalculatedPhases = recalculationResult.phases

        setValue('phases', recalculatedPhases, {
            shouldDirty: true,
            shouldValidate: true,
        })

        setCalculationError(error)
        setPhaseMessage('Phases reset to last saved values.')
    }, [setValue, startDate])

    const handleToggleView = useCallback((): void => {
        setIsGanttView(previousValue => !previousValue)
    }, [])

    const handleCheckboxChange = useCallback((): void => undefined, [])

    return (
        <section className={styles.container}>
            <div className={styles.configPanel}>
                <div className={styles.checkboxRow}>
                    <InputCheckbox
                        checked={isSchedulingApiEnabled}
                        disabled={isSectionDisabled}
                        label='Enable Scheduling API'
                        name='legacy.useSchedulingAPI'
                        onChange={handleCheckboxChange}
                        onClick={handleSchedulingToggle}
                    />
                </div>

                <p className={styles.hintText}>
                    Turn this off to skip scheduling fields and phase submission.
                </p>
            </div>

            <div className={styles.configPanel}>
                <div className={styles.checkboxRow}>
                    <InputCheckbox
                        checked={!!milestoneEnabled}
                        disabled={isSectionDisabled || !isSchedulingApiEnabled}
                        label='Enable Milestone Configuration'
                        name='milestoneConfiguration.enabled'
                        onChange={handleCheckboxChange}
                        onClick={handleMilestoneToggle}
                    />
                </div>

                <div className={styles.grid}>
                    <FormFieldWrapper
                        label='Milestone Count'
                        name='milestoneConfiguration.milestoneCount'
                        required={!!milestoneEnabled}
                    >
                        <input
                            className={styles.numberInput}
                            disabled={isSectionDisabled || !isSchedulingApiEnabled || !milestoneEnabled}
                            id='milestoneConfiguration.milestoneCount'
                            min={1}
                            onChange={handleMilestoneCountChange}
                            type='number'
                            value={milestoneCount ?? ''}
                        />
                    </FormFieldWrapper>

                    <FormFieldWrapper
                        label='Milestone Duration (days)'
                        name='milestoneConfiguration.milestoneDurationDays'
                        required={!!milestoneEnabled}
                    >
                        <input
                            className={styles.numberInput}
                            disabled={isSectionDisabled || !isSchedulingApiEnabled || !milestoneEnabled}
                            id='milestoneConfiguration.milestoneDurationDays'
                            min={1}
                            onChange={handleMilestoneDurationChange}
                            type='number'
                            value={milestoneDurationDays ?? ''}
                        />
                    </FormFieldWrapper>
                </div>
            </div>

            {isSchedulingApiEnabled
                ? (
                    <>
                        <div className={styles.grid}>
                            <TimelineTemplateField
                                disabled={isSectionDisabled}
                                name='timelineTemplateId'
                                required
                            />

                            <StartDateTimeInput
                                disabled={isSectionDisabled}
                                label='Challenge Start Date/Time'
                                onChange={handleStartDateChange}
                                value={startDate}
                            />
                        </div>

                        <div className={styles.header}>
                            <h4 className={styles.title}>Challenge Schedule</h4>
                            <span className={styles.timezone}>
                                Timezone:
                                {' '}
                                {currentTimezone}
                            </span>
                        </div>

                        <div className={styles.toolbar}>
                            <Button
                                disabled={isSectionDisabled || !phases.length}
                                label={isGanttView ? 'Switch to Editor View' : 'Switch to Gantt View'}
                                onClick={handleToggleView}
                                secondary
                                size='lg'
                            />

                            {!isGanttView
                                ? (
                                    <Button
                                        disabled={isSectionDisabled}
                                        label='+ Add Phase'
                                        onClick={handleAddPhase}
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
                                    {phases.length
                                        ? phases.map((phase, index) => (
                                            <PhaseEditorRow
                                                disabled={isSectionDisabled}
                                                endDate={phase.scheduledEndDate}
                                                index={index}
                                                key={phase.id || phase.phaseId || `${index}`}
                                                onDelete={handleDeletePhase}
                                                onDurationChange={handleDurationChange}
                                                phase={phase}
                                            />
                                        ))
                                        : <p className={styles.emptyText}>Select a template to generate phases.</p>}
                                </div>
                            )}

                        {!isGanttView
                            ? (
                                <div className={styles.phaseActions}>
                                    <Button
                                        disabled={isSectionDisabled || !phases.length}
                                        label='Save Phases'
                                        onClick={handleSavePhases}
                                        primary
                                        size='lg'
                                    />

                                    <Button
                                        disabled={isSectionDisabled || !savedPhasesRef.current.length}
                                        label='Reset Phases'
                                        onClick={handleResetPhases}
                                        secondary
                                        size='lg'
                                    />
                                </div>
                            )
                            : undefined}
                    </>
                )
                : (
                    <p className={styles.emptyText}>
                        Scheduling is disabled. Enable Scheduling API to configure timeline and phases.
                    </p>
                )}

            {phaseMessage
                ? <p className={styles.message}>{phaseMessage}</p>
                : undefined}

            {isSchedulingApiEnabled && calculationError
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
