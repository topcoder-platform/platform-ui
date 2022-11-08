import {
    Dispatch,
    FC,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import { useClickOutside } from '../hooks'
import { ActiveTabTipIcon, IconOutline } from '../svgs'

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
    const [menuIsVisible, setMenuIsVisible]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)
    const triggerRef: MutableRefObject<any> = useRef(undefined)

    const activeTab: TabsNavItem = useMemo(() => (
        props.tabs.find(tab => tab.id === tabOpened) as TabsNavItem
    ), [tabOpened, props.tabs])

    const updateOffset: (tabId: string) => void = useCallback((tabId: string) => {

        const index: number = props.tabs.findIndex(tab => tab.id === tabId)
        if (index === -1) {
            setOffset(0)
            return
        }

        const activatedTab: HTMLElement = tabRefs.current[index]
        setOffset(activatedTab.offsetLeft + activatedTab.offsetWidth / 2)
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

    const renderTabItem: (tab: TabsNavItem, activeTabId?: string, ref?: (el: HTMLDivElement) => void) => ReactNode = (
        tab: TabsNavItem,
        activeTabId?: string,
        ref?: (el: HTMLDivElement) => void,
    ) => (
        <div
            ref={ref}
            className={classNames(styles['tab-item'], activeTabId === tab.id && 'active')}
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
    )

    useClickOutside(triggerRef.current, () => setMenuIsVisible(false))

    return (
        <div className={styles['tabs-wrapper']}>
            <div
                className={
                    classNames(
                        styles['menu-trigger'],
                        'desktop-hide',
                        menuIsVisible && styles['menu-is-visible'],
                    )
                }
                onClick={() => setMenuIsVisible((menuWasVisible: boolean) => !menuWasVisible)}
                ref={triggerRef}
            >
                {renderTabItem(activeTab)}
                <IconOutline.ChevronDownIcon />
            </div>

            <div className={classNames(styles['menu-wrapper'])}>
                {props.tabs.map((tab, i) => (
                    renderTabItem(tab, tabOpened, el => { tabRefs.current[i] = el as HTMLElement })
                ))}
            </div>
            <div
                className={classNames(styles['active-icon'], 'mobile-hide')}
                style={{ left: `${offset}px` }}
            >
                <ActiveTabTipIcon />
            </div>
        </div>
    )
}

export default TabsNavbar
