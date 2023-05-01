import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'
import classNames from 'classnames'

import { ArrowIcon } from '~/libs/ui'

import styles from './InfoCard.module.scss'

interface InfoCardProps {
    children?: ReactNode,
    color?: 'info' | 'success' | 'warn',
    defaultOpen?: boolean,
    isCollapsible?: boolean,
    styleNames?: Array<string>,
    title?: string,
}

const InfoCard: FC<InfoCardProps> = (props: InfoCardProps) => {

    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(props.defaultOpen ?? false)
    const additionalStyles: Array<string> = (props.styleNames ?? []).map(style => styles[style])
    const collapsibleClass: string = props.isCollapsible ? styles.collapsible : styles.notCollapsible
    const showSpacing: boolean = isOpen && !!props.title && !!props.children

    useEffect(() => {
        setIsOpen(props.defaultOpen ?? false)
    }, [props.defaultOpen])

    return (
        <div className={classNames(styles.card, styles[props.color ?? 'info'], collapsibleClass, ...additionalStyles)}>
            {renderHeader(props.isCollapsible ?? false, isOpen, setIsOpen, props.title || '')}

            {showSpacing && (
                <div className={styles.spacing} />
            )}

            {isOpen
                && <div className={styles.content}>{props.children}</div>}
        </div>
    )
}

function renderHeader(
    isCollapsible: boolean,
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    title: string,
): JSX.Element {

    const arrowClass: string | undefined = isOpen ? styles.up : undefined

    function handleClose(): void {
        setIsOpen(!isOpen)
    }

    if (isCollapsible) {
        return (
            <div
                className={classNames(styles.title, styles.collapsible)}
                onClick={handleClose}
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
