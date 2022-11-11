import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useMemo, useState } from 'react'

import { TabsNavbar, TabsNavItem } from '../../../../lib'

import { getMyTabsNavbarTabs, MyTabsViews } from './tabs-navbar.config'

interface MyTabsNavbarProps {
    children: ReactNode
    completed: number
    inProgress: number
    onTabChange: (activeTab: MyTabsViews) => void
}

const MyTabsNavbar: FC<MyTabsNavbarProps> = (props: MyTabsNavbarProps) => {
    const [activeTab, setActiveTab]: [MyTabsViews, Dispatch<SetStateAction<MyTabsViews>>]
        = useState<MyTabsViews>(MyTabsViews.inProgress)

    const tabs: ReadonlyArray<TabsNavItem> = useMemo(() => getMyTabsNavbarTabs(
        props.completed,
        props.inProgress,
    ), [props.completed, props.inProgress])

    const handleOnChange: (evTab: string) => void = (evTab: string) => {
        const tab: MyTabsViews = evTab as MyTabsViews
        setActiveTab(tab)
        props.onTabChange(tab)
    }

    useEffect(() => {
        props.onTabChange(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.onTabChange])

    return (
        <>
            <TabsNavbar
                tabs={tabs}
                defaultActive={activeTab}
                onChange={handleOnChange}
            />
            {props.children}
        </>
    )
}

export default MyTabsNavbar
