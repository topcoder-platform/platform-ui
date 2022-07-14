import cn from 'classnames'
import {FC, SVGProps} from 'react'

import styles from './RadioButton.module.scss'

interface RadioProps {
    icon?: JSX.Element
    name: string
    selected?: boolean
}

const RadioButton: FC<RadioProps> = ({ icon, name, selected }: RadioProps) => {
    return (
        <div className={cn(styles['bug-delivery-radio'], selected && styles['selected'])}>
            <>
                {icon}
                <div className={styles['name']}>{name}</div>
            </>
        </div>
    )
}

export default RadioButton
