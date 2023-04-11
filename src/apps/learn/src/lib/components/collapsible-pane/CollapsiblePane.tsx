import {
    Dispatch,
    FC,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import { IconSolid, useClickOutside } from '~/libs/ui'

import styles from './CollapsiblePane.module.scss'

interface CollapsiblePaneProps {
    children: ReactNode
    isOpen?: boolean
    onToggle?: (isOpen: boolean) => void
    position?: 'to-left'|'to-right'
    title: string
}

const CollapsiblePane: FC<CollapsiblePaneProps> = (props: CollapsiblePaneProps) => {
    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const elRef: MutableRefObject<HTMLElement | any> = useRef()

    const toggle: () => void = useCallback(() => {
        setIsOpen(!isOpen)
        props.onToggle?.call(undefined, !isOpen)
    }, [isOpen, props.onToggle])

    const close: () => void = useCallback(() => {
        setIsOpen(false)
        props.onToggle?.call(undefined, false)
    }, [props.onToggle])

    useEffect(() => {
        setIsOpen(!!props.isOpen)
    }, [props.isOpen])

    useClickOutside(elRef.current, close, isOpen)

    return (
        <div
            ref={elRef}
            className={
                classNames(
                    styles.wrap,
                    props.position ?? 'to-left',
                    isOpen ? 'open' : 'collapsed',
                )
            }
        >
            <div className={styles['pane-outline']} onClick={toggle}>
                {isOpen ? <IconSolid.ChevronDoubleLeftIcon /> : <IconSolid.ChevronDoubleRightIcon />}
                {props.title}
            </div>
            <div className={styles.content}>
                {props.children}
            </div>
        </div>
    )
}

export default CollapsiblePane
