import { FC } from 'react'
import { useFormContext } from 'react-hook-form'
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
    const fields = form.watch(props.fieldName)

    const weightsSum = fields.reduce(
        (sum: number, field: { weight: string | number | undefined }) => (Number(field.weight) || 0) + sum,
        0,
    )

    return (
        <div className={styles.wrap}>
            <div className={styles.labels}>
                <div className='body-small-bold'>
                    {props.label}
                    {' '}
                    Weights:
                </div>
                <div className={classNames('body-small', props.error && 'errorMessage')}>
                    {props.description}
                </div>
            </div>
            <div className={classNames(styles.value, props.error && styles.error)}>{weightsSum}</div>
        </div>
    )
}

export default CalculatedWeightsSum
