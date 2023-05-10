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

import { useClickOutside } from '~/libs/shared/lib/hooks'

import { ActiveTabTipIcon, IconOutline } from '../svgs'

import { TabsNavItem } from './tabs-nav-item.model'
import styles from './TabsNavbar.module.scss'

export interface TabsNavbarProps {
    defaultActive: string
    onChange: (active: string) => void
    tabs: ReadonlyArray<TabsNavItem>
}

const TabsNavbar: FC<TabsNavbarProps> = (props: TabsNavbarProps) => {
    const query: URLSearchParams = new URLSearchParams(window.location.search)
    const initialTab: MutableRefObject<string | null> = useRef<string|null>(query.get('tab'))

    const [tabOpened, setTabOpened]: [string | undefined, Dispatch<SetStateAction<string | undefined>>]
        = useState<string | undefined>(props.defaultActive)
    const tabRefs: MutableRefObject<Array<HTMLElement>> = useRef([] as Array<HTMLElement>)
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

    const handleActivateTab: (tabId: string) => () => void = useCallback((tabId: string) => () => {
        setTabOpened(tabId)
        props.onChange.call(undefined, tabId)
        updateOffset(tabId)
    }, [
        props.onChange,
        updateOffset,
    ])

    function toggleMenuIsVisible(): void {
        setMenuIsVisible((menuWasVisible: boolean) => !menuWasVisible)
    }

    useLayoutEffect(() => {
        if (
            initialTab.current
            && initialTab.current !== props.defaultActive
            && props.tabs.find(tab => tab.id === initialTab.current)
        ) {
            handleActivateTab(initialTab.current)()
            initialTab.current = ''
        } else if (props.defaultActive) {
            setTabOpened(props.defaultActive)
            updateOffset(props.defaultActive)
        }
    }, [
        props.defaultActive,
        handleActivateTab,
        props.tabs,
        updateOffset,
    ])

    const renderTabItem: (
        tab: TabsNavItem,
        activeTabId?: string,
        ref?: (el: HTMLElement | null) => void
    ) => ReactNode = (
        tab,
        activeTabId,
        ref,
    ) => {
        const tabContent: ReactNode = (
            <>
                <span className={styles['tab-label']}>
                    {tab.title}
                </span>
                {tab.badges?.map(badge => (
                    <span className={classNames(styles['tab-badge'], badge.type)} key={badge.type}>
                        {badge.count}
                    </span>
                ))}
            </>
        )

        return tab.url ? (
            <a
                ref={ref}
                className={styles['tab-item']}
                href={tab.url}
                rel='noopener noreferrer'
                target='_blank'
            >
                {tabContent}
            </a>
        ) : (
            <div
                ref={ref}
                className={classNames(styles['tab-item'], activeTabId === tab.id && 'active')}
                key={tab.id}
                onClick={handleActivateTab(tab.id)}
            >
                {tabContent}
            </div>
        )
    }

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
                onClick={toggleMenuIsVisible}
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
