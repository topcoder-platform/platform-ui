import {
    ChangeEvent,
    FC,
    useCallback,
    useMemo,
} from 'react'
import classNames from 'classnames'

import { CurrencyDollarIcon } from '@heroicons/react/solid'

import { validatePrizeValue } from '../../../utils'

import styles from './PrizeInput.module.scss'

type PrizeType = 'USD' | 'POINT'

export interface PrizeInputProps {
    disabled?: boolean
    error?: boolean
    onChange: (value: number) => void
    prizeType: PrizeType
    value: number
}

export const PrizeInput: FC<PrizeInputProps> = (props: PrizeInputProps) => {
    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            const sanitized = validatePrizeValue(event.target.value)

            if (!sanitized) {
                props.onChange(0)
                return
            }

            props.onChange(Number.parseInt(sanitized, 10))
        },
        [props],
    )

    const inputValue = useMemo(() => {
        if (!Number.isFinite(props.value) || props.value <= 0) {
            return ''
        }

        return String(Math.trunc(props.value))
    }, [props.value])

    return (
        <div
            className={classNames(
                styles.container,
                props.error ? styles.error : undefined,
            )}
        >
            <div className={styles.prefix}>
                {props.prizeType === 'USD'
                    ? <CurrencyDollarIcon className={styles.icon} />
                    : <span className={styles.points}>Pts</span>}
            </div>

            <input
                className={styles.input}
                disabled={props.disabled}
                inputMode='numeric'
                maxLength={7}
                onChange={handleChange}
                type='text'
                value={inputValue}
            />
        </div>
    )
}

export default PrizeInput
