import { FC } from 'react'
import { useFormContext } from 'react-hook-form'
import get from 'lodash/get'

import {
    PhaseDurationInput,
    StartDateTimeInput,
} from '../../../../../lib/components/form'
import { ChallengePhase } from '../../../../../lib/models'

import styles from './PhaseEditorRow.module.scss'

export interface PhaseEditorRowProps {
    phase: ChallengePhase
    index: number
    onDurationChange: (index: number, durationMinutes: number) => void
    onStartDateChange: (index: number, date: Date | null) => void
    onEndDateChange: (index: number, date: Date | null) => void
    isStartDateEditable?: boolean
    disabled?: boolean
    startDate?: Date | string
    endDate?: Date | string
    endDateError?: string
}

export const PhaseEditorRow: FC<PhaseEditorRowProps> = (props: PhaseEditorRowProps) => {
    const disabled = props.disabled
    const endDateError = props.endDateError
    const endDate = props.endDate
    const index = props.index
    const isStartDateEditable = props.isStartDateEditable !== false
    const phase = props.phase
    const startDate = props.startDate
    const formContext = useFormContext()
    const durationError = get(formContext.formState.errors, `phases.${index}.duration.message`) as string | undefined

    function handleDurationChange(durationMinutes: number): void {
        props.onDurationChange(index, durationMinutes)
    }

    function handleStartDateChange(date: Date | null): void {
        props.onStartDateChange(index, date)
    }

    function handleEndDateChange(date: Date | null): void {
        props.onEndDateChange(index, date)
    }

    return (
        <div className={styles.row}>
            <div className={styles.phaseName}>
                {phase.name || `Phase ${index + 1}`}
            </div>

            <div className={styles.dateCell}>
                <StartDateTimeInput
                    disabled={disabled || !isStartDateEditable}
                    label='Start Date'
                    labelOutside
                    onChange={handleStartDateChange}
                    showTimezone={false}
                    value={startDate || phase.scheduledStartDate}
                />
            </div>

            <div className={styles.dateCell}>
                <StartDateTimeInput
                    disabled={disabled}
                    error={endDateError}
                    label='End Date'
                    labelOutside
                    onChange={handleEndDateChange}
                    showTimezone={false}
                    value={endDate || phase.scheduledEndDate}
                />
            </div>

            <div className={styles.durationCell}>
                <PhaseDurationInput
                    disabled={disabled}
                    error={durationError}
                    onChange={handleDurationChange}
                    value={Number(phase.duration) || 0}
                />
            </div>
        </div>
    )
}

export default PhaseEditorRow
