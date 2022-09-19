import { FC } from 'react'

import { Breadcrumb, BreadcrumbItemModel, ContentLayout } from '../../../../lib'
import { useGamificationBreadcrumb } from '../../game-lib'

import styles from './BadgeDetailPage.module.scss'

const BadgeDetailPage: FC = () => {
    // TDOD: use whit GAME-78
    // const { id: badgeID } : { badgeID: string } = useParams()

    const breadcrumb: Array<BreadcrumbItemModel> = useGamificationBreadcrumb([
        {
            name: 'badge detail',
            url: '#',
        },
    ])

    return (
        <ContentLayout
            contentClass={styles['contentLayout']}
            outerClass={styles['contentLayout-outer']}
            innerClass={styles['contentLayout-inner']}
            title='Badge Detail'
        >
            <Breadcrumb items={breadcrumb} />
            <div className={styles.container}>

            </div>
        </ContentLayout>
    )
}

export default BadgeDetailPage
