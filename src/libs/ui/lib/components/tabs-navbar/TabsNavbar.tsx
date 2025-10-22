import {
    Dispatch,
    MutableRefObject,
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
import TabsNavbarItem from './TabsNavbarItem'
import styles from './TabsNavbar.module.scss'

export interface TabsNavbarProps<T> {
    defaultActive: T
    onChange: (active: T) => void
    onChildChange?: (active: T, activeChild: string) => void
    tabs: ReadonlyArray<TabsNavItem<T>>
}

const TabsNavbar = <T, >(props: TabsNavbarProps<T>): JSX.Element => {
    const query: URLSearchParams = new URLSearchParams(window.location.search)
    const initialTab: MutableRefObject<T | undefined> = useRef<T|undefined>(query.get('tab') as T)

    const [tabOpened, setTabOpened]: [T | undefined, Dispatch<SetStateAction<T | undefined>>]
        = useState<T | undefined>(props.defaultActive)
    const tabRefs: MutableRefObject<Array<HTMLElement>> = useRef([] as Array<HTMLElement>)
    const [offset, setOffset]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0)
    const [menuIsVisible, setMenuIsVisible]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)
    const triggerRef: MutableRefObject<any> = useRef(undefined)

    const activeTab: TabsNavItem<T> = useMemo(() => (
        props.tabs.find(tab => tab.id === tabOpened) as TabsNavItem<T>
    ), [tabOpened, props.tabs])

    const updateOffset: (tabId: T) => void = useCallback((tabId: T) => {

        const index: number = props.tabs.findIndex(tab => tab.id === tabId)
        if (index === -1) {
            setOffset(0)
            return
        }

        const activatedTab: HTMLElement = tabRefs.current[index]
        setOffset(
            (activatedTab?.offsetLeft ?? 0)
                + (activatedTab?.offsetWidth ?? 0) / 2,
        )
    }, [
        props.tabs,
    ])

    const handleActivateTab: (tabId: T) => () => void = useCallback((tabId: T) => () => {
        setTabOpened(tabId)
        props.onChange.call(undefined, tabId)
        updateOffset(tabId)
    }, [
        props.onChange,
        updateOffset,
    ])
    const handleActivateChildTab: (
        tabId: string,
        childTabId: string,
    ) => () => void = useCallback(
        (tabId: string, childTabId: string) => () => {
            setTabOpened(tabId as T)
            props.onChildChange?.call(undefined, tabId as T, childTabId)
            updateOffset(tabId as T)
        },
        [updateOffset, props.onChildChange],
    )

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
            initialTab.current = undefined
        } else if (props.defaultActive) {
            setTabOpened(props.defaultActive)
            setTimeout(() => {
                updateOffset(props.defaultActive)
            }, 100)
        }
    }, [
        props.defaultActive,
        handleActivateTab,
        props.tabs,
        updateOffset,
    ])

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
                <TabsNavbarItem
                    tab={activeTab}
                    menuIsVisible={menuIsVisible}
                    isExtraMenu={false}
                    handleActivateTab={handleActivateTab}
                    handleActivateChildTab={handleActivateChildTab}
                />
                {props.tabs.length > 1 && <IconOutline.ChevronDownIcon />}
            </div>

            <div className={classNames(styles['menu-wrapper'])}>
                {props.tabs.map((tab, i) => (
                    <TabsNavbarItem
                        key={tab.id as string}
                        tab={tab}
                        menuIsVisible={menuIsVisible}
                        isExtraMenu
                        handleActivateTab={handleActivateTab}
                        handleActivateChildTab={handleActivateChildTab}
                        activeTabId={tabOpened}
                        ref={function r(el: HTMLElement | null) {
                            tabRefs.current[i] = el as HTMLElement
                        }}
                    />
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
