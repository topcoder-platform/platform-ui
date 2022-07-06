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

const InfoCard: FC<InfoCardProps> = ({
    children,
    color = 'gray',
    isCollapsible = false,
    isOpen = true,
    title,
}: InfoCardProps) => {

    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(isOpen)
    const collapsibleClass: string = isCollapsible ? styles.collapsible : styles.notCollapsible
    const showSpacing: boolean = open && !!title && !!children

    return (
        <div className={classNames(styles.card, styles[color], collapsibleClass)}>
            {renderHeader(isCollapsible, open, setOpen, title || '')}

            {showSpacing && (
                <div className={styles.spacing}></div>
            )}

            {open &&
                <div className={styles.content}>{children}</div>
            }
        </div>
    )
}

function renderHeader(
    isCollapsible: boolean,
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>,
    title: string
): JSX.Element {

    const arrowClass: string = open ? styles.up : undefined

    if (isCollapsible) {
        return (
            <div
                className={classNames(styles.title, styles.collapsible)}
                onClick={() => setOpen(!open)}
                role='button'
                tabIndex={0}
            >
                <span>{title}</span>

                <div className={classNames(styles.arrowIcon, arrowClass)}>
                    <ArrowIcon />
                </div>
            </div>
        )
    }

    return (
        <div className={styles.title}>
            <span>{title}</span>
        </div>
    )
}

export default InfoCard
