import { FC, useMemo } from 'react'

import { FormFieldWrapper } from '../../../../../lib/components/form'

import styles from './ChallengeFeeField.module.scss'

interface ChallengeFeeFieldProps {
    challengeFee?: number
}

export const ChallengeFeeField: FC<ChallengeFeeFieldProps> = (
    props: ChallengeFeeFieldProps,
) => {
    const formattedValue = useMemo(() => {
        if (!Number.isFinite(props.challengeFee)) {
            return ''
        }

        return `$ ${Math.trunc(props.challengeFee as number)
            .toLocaleString()}`
    }, [props.challengeFee])

    return (
        <FormFieldWrapper
            label='Challenge Fee'
            name='challengeFee'
        >
            <div className={styles.value}>{formattedValue}</div>
        </FormFieldWrapper>
    )
}

export default ChallengeFeeField
