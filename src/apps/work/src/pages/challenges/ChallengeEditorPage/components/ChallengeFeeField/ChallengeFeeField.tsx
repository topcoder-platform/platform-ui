import { FC, useMemo } from 'react'

import styles from './ChallengeFeeField.module.scss'

interface ChallengeFeeFieldProps {
    challengeFee?: number
}

export const ChallengeFeeField: FC<ChallengeFeeFieldProps> = (
    props: ChallengeFeeFieldProps,
) => {
    const formattedValue = useMemo(() => {
        if (!Number.isFinite(props.challengeFee)) {
            return '$0'
        }

        return `$${Math.trunc(props.challengeFee as number)
            .toLocaleString()}`
    }, [props.challengeFee])

    return (
        <div className={styles.lineItem}>
            <span className={styles.label}>Challenge Fee:</span>
            <span className={styles.value}>{formattedValue}</span>
        </div>
    )
}

export default ChallengeFeeField
