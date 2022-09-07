import classNames from 'classnames'
import { noop } from 'lodash'
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

import { IconSolid } from '../../../../lib'

import styles from './CollapsiblePane.module.scss'

interface CollapsiblePaneProps {
    children: ReactNode
    isOpen?: boolean
    onToggle?: (isOpen: boolean) => void
    position?: 'to-left'|'to-right'
    title: string
}

const CollapsiblePane: FC<CollapsiblePaneProps> = (props: CollapsiblePaneProps) => {
    const {onToggle = noop}: CollapsiblePaneProps = props
    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const elRef: MutableRefObject<HTMLElement | any> = useRef()

    const toggle: () => void = useCallback(() => {
      setIsOpen(!isOpen)
      onToggle(!isOpen)
    }, [isOpen, onToggle])

    const close: () => void = useCallback(() => {
        setIsOpen(false)
        onToggle(false)
    }, [onToggle])

    useEffect(() => {
        setIsOpen(!!props.isOpen)
    }, [props.isOpen])

    useEffect(() => {
        const handleClickOutside: (ev: MouseEvent) => void = (ev: MouseEvent) => {
            if (elRef.current && !elRef.current.contains(ev.target)) {
                close()
            }
        }
        if (isOpen) {
            document.addEventListener('click', handleClickOutside)
        }
        return () => document.removeEventListener('click', handleClickOutside)
    }, [close, isOpen])

    return (
        <div ref={elRef} className={
            classNames(
                styles['wrap'],
                props.position ?? 'to-left',
                isOpen ? 'open' : 'collapsed',
            )
        }>
            <div className={styles['pane-outline']} onClick={toggle}>
                {isOpen ? <IconSolid.ChevronDoubleLeftIcon /> : <IconSolid.ChevronDoubleRightIcon />}
                {props.title}
            </div>
            <div className={styles['content']}>
                {props.children}
            </div>
        </div>
    )
}

export default CollapsiblePane
