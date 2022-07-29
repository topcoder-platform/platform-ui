import { FC, ReactNode } from 'react'

import styles from './ActionButton.module.scss'

interface ActionButtonProps {
    icon: ReactNode
    onClick?: () => void
}

const ActionButton: FC<ActionButtonProps> = (props: ActionButtonProps) => {
    return (
        <div className={styles['wrap']} onClick={props.onClick}>
            {props.icon}
        </div>
    )
}

export default ActionButton
