import classNames from 'classnames'
import { Dispatch, FC, ReactNode, SetStateAction, useState } from 'react'

import { ArrowIcon } from '../svgs'

import styles from './InfoCard.module.scss'

interface InfoCardProps {
    children: ReactNode,
    color: 'gray' | 'turquoise' | 'yellow',
    isCollapsible: boolean,
    isOpen: boolean,
    title?: string,
}

// tslint:disable-next-line: cyclomatic-complexity
const InfoCard: FC<InfoCardProps> = ({
    color = 'gray',
    isCollapsible = false,
    isOpen = true,
    ...props
}: InfoCardProps) => {

    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(isOpen)
    const showArrowUp: string = open ? styles.up : undefined
    const showCollapsible: string = isCollapsible ? styles.collapsible : styles.notCollapsible
    const showCollapsibleTitle: boolean = isCollapsible ? styles.collapsible : undefined
    const showSpacing: boolean = open && !!props.title && !!props.children

    return (
        <div className={classNames(styles.card, styles[color], showCollapsible)}>
            {isCollapsible && (
                <div
                    className={classNames(styles.title, showCollapsibleTitle)}
                    onClick={() => setOpen(!open)}
                    role='button'
                    tabIndex={0}
                >
                    <span>{props.title}</span>

                    <div className={classNames(styles.arrowIcon, showArrowUp)}>
                        <ArrowIcon />
                    </div>
                </div>
            )}

            {!isCollapsible && (
                <div className={styles.title}>
                    <span>{props.title}</span>
                </div>
            )}

            {showSpacing && (
                <div className={styles.spacing}></div>
            )}

            {open &&
                <div className={styles.content}>{props.children}</div>
            }
        </div>
    )
}

export default InfoCard
