import classNames from 'classnames'
import { Dispatch, FC, ReactNode, SetStateAction, useState } from 'react'

import { ArrowIcon } from '../svgs'

import styles from './InfoCard.module.scss'

interface InfoCardProps {
    children: ReactNode,
    color: 'gray' | 'turquoise' | 'yellow',
    isCollapsible: boolean,
    open: boolean,
    title?: string,
}

const InfoCard: FC<InfoCardProps> = ({
    children,
    color = 'gray',
    isCollapsible = false,
    open = true,
    title,
}: InfoCardProps) => {

    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(open)
    const collapsibleClass: string = isCollapsible ? styles.collapsible : styles.notCollapsible
    const showSpacing: boolean = isOpen && !!title && !!children

    return (
        <div className={classNames(styles.card, styles[color], collapsibleClass)}>
            {renderHeader(isCollapsible, isOpen, setIsOpen, title || '')}

            {showSpacing && (
                <div className={styles.spacing}></div>
            )}

            {isOpen &&
                <div className={styles.content}>{children}</div>
            }
        </div>
    )
}

function renderHeader(
    isCollapsible: boolean,
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    title: string
): JSX.Element {

    const arrowClass: string = isOpen ? styles.up : undefined

    if (isCollapsible) {
        return (
            <div
                className={classNames(styles.title, styles.collapsible)}
                onClick={() => setIsOpen(!isOpen)}
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
