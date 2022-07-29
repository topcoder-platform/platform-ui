import classNames from 'classnames'
import {
    Dispatch,
    FC,
    MutableRefObject,
    SetStateAction,
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
} from 'react'

import { ActiveTabTipIcon } from '../svgs'

import { TabsNavItem } from './tabs-nav-item.model'
import styles from './TabsNavbar.module.scss'

export interface TabsNavbarProps {
    defaultActive: string
    onChange: (active: string) => void
    tabs: ReadonlyArray<TabsNavItem>
}

const TabsNavbar: FC<TabsNavbarProps> = (props: TabsNavbarProps) => {

    const { defaultActive, onChange, tabs }: TabsNavbarProps = props

    const tabRefs: MutableRefObject<Array<HTMLElement>> = useRef([] as Array<HTMLElement>)
    const [tabOpened, setTabOpened]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState<string | undefined>(props.defaultActive)
    const [offset, setOffset]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0)

    const updateOffset: (tabId: string) => void = useCallback((tabId: string) => {

        const index: number = props.tabs.findIndex(tab => tab.id === tabId)
        if (index === -1) {
            setOffset(0)
            return
        }

        const activeTab: HTMLElement = tabRefs.current[index]
        setOffset(activeTab.offsetLeft + activeTab.offsetWidth / 2)
    }, [
        props.tabs,
    ])

    const handleActivateTab: (tabId: string) => void = useCallback((tabId: string) => {
        setTabOpened(tabId)
        onChange(tabId)
        updateOffset(tabId)
    }, [
        onChange,
        updateOffset,
    ])

    useLayoutEffect(() => {

        const query: URLSearchParams = new URLSearchParams(window.location.search)
        const initialTab: string | null = query.get('tab')

        if (initialTab && tabs.find(tab => tab.id === initialTab)) {
            handleActivateTab(initialTab)
        } else if (defaultActive) {
            setTabOpened(defaultActive)
            updateOffset(defaultActive)
        }
    }, [
        defaultActive,
        handleActivateTab,
        tabs,
        updateOffset,
    ])

    return (
        <div className={styles['tabs-wrapper']}>
            {props.tabs.map((tab, i) => (
                <div
                    ref={el => tabRefs.current[i] = el as HTMLElement}
                    className={classNames(styles['tab-item'], tabOpened === tab.id && 'active')}
                    key={tab.id}
                    onClick={() => handleActivateTab(tab.id)}
                >
                    <span className={styles['tab-label']}>
                        {tab.title}
                    </span>
                    {tab.badges?.map((badge, id) => (
                        <span className={classNames(styles['tab-badge'], badge.type)} key={id}>
                            {badge.count}
                        </span>
                    ))}
                </div>
            ))}
            <div
                className={styles['active-icon']}
                style={{ left: `${offset}px` }}
            >
                <ActiveTabTipIcon />
            </div>
        </div>
    )
}

export default TabsNavbar
