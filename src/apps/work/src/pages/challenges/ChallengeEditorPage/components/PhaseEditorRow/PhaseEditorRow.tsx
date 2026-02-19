import { FC } from 'react'
import { useFormContext } from 'react-hook-form'
import get from 'lodash/get'

import { PhaseDurationInput } from '../../../../../lib/components/form'
import { ChallengePhase } from '../../../../../lib/models'
import { formatDateTime } from '../../../../../lib/utils'

import styles from './PhaseEditorRow.module.scss'

export interface PhaseEditorRowProps {
    phase: ChallengePhase
    index: number
    onDurationChange: (index: number, durationMinutes: number) => void
    disabled?: boolean
    endDate?: Date | string
}

export const PhaseEditorRow: FC<PhaseEditorRowProps> = (props: PhaseEditorRowProps) => {
    const disabled = props.disabled
    const endDate = props.endDate
    const index = props.index
    const phase = props.phase
    const formContext = useFormContext()
    const durationError = get(formContext.formState.errors, `phases.${index}.duration.message`) as string | undefined
    function handleDurationChange(durationMinutes: number): void {
        props.onDurationChange(index, durationMinutes)
    }

    return (
        <div className={styles.row}>
            <div className={styles.phaseName}>
                {phase.name || `Phase ${index + 1}`}
            </div>

            <div className={styles.durationCell}>
                <PhaseDurationInput
                    disabled={disabled}
                    error={durationError}
                    label='Duration'
                    onChange={handleDurationChange}
                    value={Number(phase.duration) || 0}
                />
            </div>

            <div className={styles.endDateCell}>
                <span className={styles.endDateLabel}>End Date</span>
                <span className={styles.endDateValue}>{formatDateTime(endDate || phase.scheduledEndDate)}</span>
            </div>
        </div>
    )
}

export default PhaseEditorRow
