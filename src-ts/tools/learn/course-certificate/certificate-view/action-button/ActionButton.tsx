import { FC, ReactNode } from 'react'

import styles from './ActionButton.module.scss'

interface ActionButtonProps {
    icon: ReactNode
    onClick?: () => void
    target?: string
    url?: string
}

const ActionButton: FC<ActionButtonProps> = (props: ActionButtonProps) => {

    // if there is a url, this is a link button
    if (!!props.url) {
        return (
            <a
                className={styles['wrap']}
                href={props.url}
                onClick={props.onClick}
                tabIndex={-1}
                target={props.target}
            >
                {props.icon}
            </a>
        )
    }

    return (
        <div className={styles['wrap']} onClick={props.onClick}>
            {props.icon}
        </div>
    )
}

export default ActionButton
