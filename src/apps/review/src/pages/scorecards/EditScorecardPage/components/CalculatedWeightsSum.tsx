import { FC, useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import classNames from 'classnames'

import styles from './CalculatedWeightsSum.module.scss'

interface CalculatedWeightsSumProps {
    description: string;
    error?: string;
    fieldName: string;
    label: string;
}

const CalculatedWeightsSum: FC<CalculatedWeightsSumProps> = props => {
    const form = useFormContext()
    const watchedFields = useWatch({
        control: form.control,
        defaultValue: [],
        name: props.fieldName,
    }) as { weight?: number | string | null }[] | undefined

    const fields = useMemo(
        () => (Array.isArray(watchedFields) ? watchedFields : []),
        [watchedFields],
    )

    const weightsSum = useMemo(
        () => fields.reduce(
            (sum: number, field: { weight?: string | number | null }) => (
                Number(field?.weight ?? 0) + sum
            ),
            0,
        ),
        [fields],
    )

    return (
        <div className={styles.wrap}>
            <div className={styles.labels}>
                <div className='body-small-bold'>
                    {props.label}
                    {' '}
                    Weights:
                </div>
                <div className={classNames('body-small', props.error && styles.inputError)}>
                    {props.description}
                </div>
            </div>
            <div className={classNames(styles.value, props.error && styles.error)}>{weightsSum}</div>
        </div>
    )
}

export default CalculatedWeightsSum
