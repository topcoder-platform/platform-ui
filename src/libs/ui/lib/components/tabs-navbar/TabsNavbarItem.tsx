/**
 * Tabs navbar item.
 */
import {
    ForwardedRef,
    forwardRef,
    MouseEvent,
    ReactNode,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import { DropdownMenu } from '~/apps/admin/src/lib'
import { useWindowSize, WindowSize } from '~/libs/shared'

import { IconOutline } from '../svgs'

import { TabsNavItem } from './tabs-nav-item.model'
import styles from './TabsNavbarItem.module.scss'

interface TabsNavbarItemProps<T> {
    className?: string
    tab: TabsNavItem<T>
    menuIsVisible: boolean
    isExtraMenu: boolean
    activeTabId?: T
    handleActivateTab: (tabId: T) => () => void
    handleActivateChildTab: (tabId: T, childTabId: string) => () => void
}

export const TabsNavbarItem = forwardRef<HTMLElement, TabsNavbarItemProps<any>>(
    <T, >(
        props: TabsNavbarItemProps<T>,
        ref: ForwardedRef<HTMLElement>,
    ) => {
        const [openDropdown, setOpenDropdown] = useState(false)
        const { width: screenWidth }: WindowSize = useWindowSize()
        const isMobile = useMemo(() => screenWidth < 745, [screenWidth])

        const tabContent: ReactNode = (
            <>
                <span className={classNames(styles['tab-label'], 'tab-label')}>
                    {props.tab.title}
                </span>
                {props.tab.badges?.map(badge => (
                    <span
                        className={classNames(styles['tab-badge'], badge.type)}
                        key={badge.type}
                    >
                        {badge.count}
                    </span>
                ))}
            </>
        )

        if (props.tab.url) {
            return (
                <a
                    ref={ref as ForwardedRef<HTMLAnchorElement>}
                    className={classNames(
                        styles['tab-item'],
                        {
                            [styles.isNotExtraMenu]: !props.isExtraMenu,
                        },
                        props.className,
                    )}
                    key={props.tab.id as string}
                    href={props.tab.url}
                    rel='noopener noreferrer'
                    target='_blank'
                >
                    {tabContent}
                </a>
            )
        }

        if (props.tab.children) {
            return props.menuIsVisible || !props.isExtraMenu || !isMobile ? (
                <DropdownMenu
                    open={openDropdown}
                    setOpen={setOpenDropdown}
                    key={props.tab.id as string}
                    placement='bottom-end'
                    shouldIgnoreWhenClickMenu
                    classNames={{
                        trigger: styles.blockMenuTrigger,
                    }}
                    triggerUI={(
                        <div
                            ref={ref as ForwardedRef<HTMLDivElement>}
                            className={classNames(
                                styles['tab-item'],
                                {
                                    [styles.isNotExtraMenu]: !props.isExtraMenu,
                                },
                                props.activeTabId === props.tab.id && 'active',
                                props.className,
                            )}
                            key={props.tab.id as string}
                            onClick={function onClick(
                                event: MouseEvent<HTMLDivElement>,
                            ) {
                                if (!isMobile || props.isExtraMenu) {
                                    event.stopPropagation()
                                    event.preventDefault()
                                    setOpenDropdown(preValue => !preValue)
                                }
                            }}
                        >
                            {tabContent}
                            {(props.isExtraMenu || !isMobile) && (
                                <IconOutline.ChevronDownIcon
                                    className={styles.dropdownIcon}
                                />
                            )}
                        </div>
                    )}
                >
                    <ul>
                        {props.tab.children.map(item => (
                            <li key={item.title}>
                                <div
                                    role='button'
                                    tabIndex={0}
                                    onClick={function onClick() {
                                        setOpenDropdown(false)
                                        if (item.id) {
                                            props.handleActivateChildTab(
                                                props.tab.id,
                                                item.id,
                                            )()
                                        }
                                    }}
                                >
                                    {item.title}
                                </div>
                            </li>
                        ))}
                    </ul>
                </DropdownMenu>
            ) : (
                <></>
            )
        }

        return (
            <div
                ref={ref as ForwardedRef<HTMLDivElement>}
                className={classNames(
                    styles['tab-item'],
                    {
                        [styles.isNotExtraMenu]: !props.isExtraMenu,
                    },
                    props.activeTabId === props.tab.id && 'active',
                    props.className,
                )}
                key={props.tab.id as string}
                onClick={props.handleActivateTab(props.tab.id)}
            >
                {tabContent}
            </div>
        )
    },
)

export default TabsNavbarItem
