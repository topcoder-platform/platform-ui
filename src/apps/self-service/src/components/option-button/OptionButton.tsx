import { FC } from 'react'
import cn from 'classnames'

import styles from './OptionButton.module.scss'

interface RadioProps {
    icon?: JSX.Element
    isRecommended?: boolean
    name: string
    selected?: boolean
}

const OptionButton: FC<RadioProps> = (props: RadioProps) => (
    <div
        className={
            cn(
                styles['bug-delivery-radio'],
                { [styles.selected]: props.selected, [styles.recommended]: props.isRecommended },
            )
        }
    >
        <>
            {props.icon}
            <div className={styles.name}>{props.name}</div>
            {props.isRecommended && <div className={styles['recommended-text-wrapper']}>Recommended</div>}
        </>
    </div>
)

export default OptionButton
