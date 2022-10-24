import cn from 'classnames'
import { FC } from 'react'

import styles from './RadioButton.module.scss'

interface RadioProps {
    icon?: JSX.Element
    isRecommended?: boolean
    name: string
    selected?: boolean
}

const RadioButton: FC<RadioProps> = ({ icon, name, selected, isRecommended }: RadioProps) => {
    return (
        <div className={cn(styles['bug-delivery-radio'], { [styles.selected]: selected, [styles.recommended]: isRecommended })}>
            <>
                {icon}
                <div className={styles['name']}>{name}</div>
                {isRecommended && <div className={styles['recommended-text-wrapper']}>Recommended</div>}
            </>
        </div>
    )
}

export default RadioButton
