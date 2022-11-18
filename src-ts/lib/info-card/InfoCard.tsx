import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'
import classNames from 'classnames'

import { ArrowIcon } from '../svgs'

import styles from './InfoCard.module.scss'

interface InfoCardProps {
    children?: ReactNode,
    color?: 'info' | 'success' | 'warn',
    defaultOpen?: boolean,
    isCollapsible?: boolean,
    styleNames?: Array<string>,
    title?: string,
}

const InfoCard: FC<InfoCardProps> = ({
    children,
    color = 'info',
    defaultOpen = true,
    isCollapsible = false,
    styleNames = [],
    title,
}: InfoCardProps) => {

    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(defaultOpen)
    const additionalStyles: Array<{ [key: string]: any }> = styleNames.map(style => styles[style])
    const collapsibleClass: string = isCollapsible ? styles.collapsible : styles.notCollapsible
    const showSpacing: boolean = isOpen && !!title && !!children

    useEffect(() => {
        setIsOpen(defaultOpen)
    }, [defaultOpen])

    return (
        <div className={classNames(styles.card, styles[color], collapsibleClass, ...additionalStyles)}>
            {renderHeader(isCollapsible, isOpen, setIsOpen, title || '')}

            {showSpacing && (
                <div className={styles.spacing} />
            )}

            {isOpen
                && <div className={styles.content}>{children}</div>}
        </div>
    )
}

function renderHeader(
    isCollapsible: boolean,
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    title: string,
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
