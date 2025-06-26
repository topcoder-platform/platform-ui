import {
    Dispatch,
    FC,
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

export interface TabsNavbarProps {
    defaultActive: string
    onChange: (active: string) => void
    onChildChange?: (active: string, activeChild: string) => void
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
        setOffset(
            (activatedTab?.offsetLeft ?? 0)
                + (activatedTab?.offsetWidth ?? 0) / 2,
        )
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
    const handleActivateChildTab: (
        tabId: string,
        childTabId: string,
    ) => () => void = useCallback(
        (tabId: string, childTabId: string) => () => {
            setTabOpened(tabId)
            props.onChildChange?.call(undefined, tabId, childTabId)
            updateOffset(tabId)
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
            initialTab.current = ''
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
                <IconOutline.ChevronDownIcon />
            </div>

            <div className={classNames(styles['menu-wrapper'])}>
                {props.tabs.map((tab, i) => (
                    <TabsNavbarItem
                        key={tab.id}
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
