import { FC, useMemo } from 'react'

import { PHASE_STATUS } from '../../../../../lib/constants'
import { ChallengePhase, PhaseDefinition } from '../../../../../lib/models'
import {
    formatDateTime,
    getPhaseHoursMinutes,
} from '../../../../../lib/utils'

import styles from './TimelineVisualization.module.scss'

export interface TimelineVisualizationProps {
    phases: ChallengePhase[]
    startDate?: Date | string | null
    challengePhases?: PhaseDefinition[]
}

interface TimelinePhaseData {
    key: string
    name: string
    status: string
    durationMinutes: number
    startDate: Date
    endDate: Date
    definition?: PhaseDefinition
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

function getStatusValue(phase: ChallengePhase): string {
    if (phase.status) {
        return phase.status
    }

    if (phase.isOpen) {
        return PHASE_STATUS.OPEN
    }

    return PHASE_STATUS.SCHEDULED
}

function formatDuration(durationMinutes: number): string {
    const hoursMinutes = getPhaseHoursMinutes(durationMinutes)
    const hours = hoursMinutes.hours
    const minutes = hoursMinutes.minutes

    if (!hours) {
        return `${minutes}m`
    }

    if (!minutes) {
        return `${hours}h`
    }

    return `${hours}h ${minutes}m`
}

export const TimelineVisualization: FC<TimelineVisualizationProps> = (
    props: TimelineVisualizationProps,
) => {
    const challengePhases = props.challengePhases
    const phases = props.phases
    const startDate = props.startDate

    const phaseDefinitionMap = useMemo(
        () => new Map((challengePhases || []).map(phase => [phase.id, phase])),
        [challengePhases],
    )

    const timelineData = useMemo<TimelinePhaseData[]>(
        () => phases.reduce<TimelinePhaseData[]>(
            (accumulator, phase, index) => {
                const parsedStartDate = toDate(phase.scheduledStartDate)
                const parsedEndDate = toDate(phase.scheduledEndDate)

                if (!parsedStartDate || !parsedEndDate) {
                    return accumulator
                }

                const definition = phase.phaseId
                    ? phaseDefinitionMap.get(phase.phaseId)
                    : undefined

                accumulator.push({
                    definition,
                    durationMinutes: Number(phase.duration) || 0,
                    endDate: parsedEndDate,
                    key: phase.id || phase.phaseId || `${index}`,
                    name: phase.name || definition?.name || `Phase ${index + 1}`,
                    startDate: parsedStartDate,
                    status: getStatusValue(phase),
                })

                return accumulator
            },
            [],
        ),
        [phaseDefinitionMap, phases],
    )

    const timelineStart = useMemo(() => {
        const earliestStart = timelineData.reduce<Date | undefined>(
            (earliest, phase) => {
                if (!earliest || phase.startDate.getTime() < earliest.getTime()) {
                    return phase.startDate
                }

                return earliest
            },
            toDate(startDate),
        )

        return earliestStart
    }, [startDate, timelineData])

    const timelineEnd = useMemo(() => timelineData.reduce<Date | undefined>(
        (latest, phase) => {
            if (!latest || phase.endDate.getTime() > latest.getTime()) {
                return phase.endDate
            }

            return latest
        },
        undefined,
    ), [timelineData])

    if (!timelineData.length || !timelineStart || !timelineEnd) {
        return (
            <div className={styles.emptyState}>
                Timeline visualization will appear after phases are scheduled.
            </div>
        )
    }

    const totalDuration = Math.max(1, timelineEnd.getTime() - timelineStart.getTime())

    return (
        <div className={styles.container}>
            <div className={styles.summary}>
                <div>
                    <span className={styles.summaryLabel}>Timeline Start</span>
                    <span className={styles.summaryValue}>{formatDateTime(timelineStart)}</span>
                </div>
                <div>
                    <span className={styles.summaryLabel}>Timeline End</span>
                    <span className={styles.summaryValue}>{formatDateTime(timelineEnd)}</span>
                </div>
            </div>

            <div
                aria-label='Challenge timeline visualization'
                className={styles.chart}
                role='img'
            >
                {timelineData.map(phase => {
                    const phaseStartOffset = phase.startDate.getTime() - timelineStart.getTime()
                    const phaseDuration = Math.max(
                        60_000,
                        phase.endDate.getTime() - phase.startDate.getTime(),
                    )
                    const leftPercent = (phaseStartOffset / totalDuration) * 100
                    const widthPercent = Math.max(2, (phaseDuration / totalDuration) * 100)

                    const statusClassName = phase.status === PHASE_STATUS.CLOSED
                        ? styles.closed
                        : phase.status === PHASE_STATUS.OPEN
                            ? styles.open
                            : styles.scheduled

                    return (
                        <div className={styles.phaseRow} key={phase.key}>
                            <div className={styles.phaseMeta}>
                                <div className={styles.phaseName}>{phase.name}</div>
                                <div className={styles.phaseInfo}>
                                    {formatDuration(phase.durationMinutes)}
                                    {' '}
                                    |
                                    {' '}
                                    {formatDateTime(phase.startDate)}
                                    {' '}
                                    -
                                    {' '}
                                    {formatDateTime(phase.endDate)}
                                </div>
                            </div>

                            <div className={styles.track}>
                                <div
                                    className={`${styles.bar} ${statusClassName}`}
                                    style={{
                                        left: `${leftPercent}%`,
                                        width: `${widthPercent}%`,
                                    }}
                                    title={phase.definition?.description || phase.name}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            <ul className={styles.accessibleList}>
                {timelineData.map(phase => (
                    <li key={`${phase.key}-text`}>
                        {phase.name}
                        {': '}
                        {formatDateTime(phase.startDate)}
                        {' to '}
                        {formatDateTime(phase.endDate)}
                        {' ('}
                        {formatDuration(phase.durationMinutes)}
                        )
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default TimelineVisualization
