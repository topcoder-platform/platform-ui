import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Params, useLocation, useParams } from 'react-router-dom'

import { Breadcrumb, BreadcrumbItemModel, ButtonProps, ContentLayout, LoadingSpinner, PageDivider, TabsNavbar, TabsNavItem } from '../../../../lib'
import { BadgeDetailPageHandler, GameBadge, useGamificationBreadcrumb, useGetGameBadgeDetails } from '../../game-lib'

import { badgeDetailsTabs, BadgeDetailsTabViews } from './badge-details-tabs.config'
import styles from './BadgeDetailPage.module.scss'

const BadgeDetailPage: FC = () => {
    const [headerButtonConfig, setHeaderButtonConfig]: [
        ButtonProps | undefined,
        Dispatch<SetStateAction<ButtonProps | undefined>>,
    ]
        = useState<ButtonProps | undefined>()

    const breadcrumb: Array<BreadcrumbItemModel> = useGamificationBreadcrumb([
        {
            name: 'badge detail',
            url: '#',
        },
    ])

    const { id: badgeID }: Readonly<Params<string>> = useParams()

    const { hash }: { hash: string } = useLocation()

    const activeTab: string = hash === '#award' ? BadgeDetailsTabViews.manualAward : BadgeDetailsTabViews.awardedMembers

    const [tabs]: [
        ReadonlyArray<TabsNavItem>,
        Dispatch<SetStateAction<ReadonlyArray<TabsNavItem>>>,
    ]
        = useState<ReadonlyArray<TabsNavItem>>([...badgeDetailsTabs])

    const badgeDetailsHandler: BadgeDetailPageHandler<GameBadge> = useGetGameBadgeDetails(badgeID as string)

    useEffect(() => {
        if (badgeDetailsHandler.data) {
            switch (badgeDetailsHandler.data?.active) {
                case true:
                    setHeaderButtonConfig({
                        label: 'DeActivate',
                        onClick: onDisableBadge,
                    })
                    break
                case false:
                    setHeaderButtonConfig({
                        label: 'Activate',
                        onClick: onActivateBadge,
                    })
                    break
            }
        }
    }, [
        badgeDetailsHandler.data,
    ])

    function onChangeTab(active: string): void {
        // TODO: implement in GAME-129
    }

    function onActivateBadge(): void {
        // TODO: implement in GAME-127
    }

    function onDisableBadge(): void {
        // TODO: implement in GAME-127
    }

    // define the tabs so they can be displayed on various results
    const tabsElement: JSX.Element = (
        <TabsNavbar
            tabs={tabs}
            defaultActive={activeTab}
            onChange={onChangeTab}
        />
    )

    if (!badgeDetailsHandler.data && !badgeDetailsHandler.error) {
        return <LoadingSpinner />
    }

    return (
        <ContentLayout
            title='Badge Detail'
            buttonConfig={headerButtonConfig}
        >
            <Breadcrumb items={breadcrumb} />
            <div className={styles.container}>
                {
                    badgeDetailsHandler.error ? (
                        <div className={styles.error}>
                            {badgeDetailsHandler.error.message}
                        </div>
                    ) : (
                        <>
                            <div className={styles.badge}>
                                <div className={styles.badgeImage}>
                                    <img src={badgeDetailsHandler.data?.badge_image_url} alt='badge media preview' />
                                </div>
                                <div className={styles.badgeDetails}>
                                    <h2>{badgeDetailsHandler.data?.badge_name}</h2>
                                    <div className={styles.badgeDesc}>
                                        <ReactMarkdown children={badgeDetailsHandler.data?.badge_description as string} />
                                    </div>
                                </div>
                            </div>
                            <PageDivider />
                            {tabsElement}
                        </>
                    )
                }
            </div>
        </ContentLayout>
    )
}

export default BadgeDetailPage
