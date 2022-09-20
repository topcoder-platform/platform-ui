import { FC } from 'react'

import { Breadcrumb, BreadcrumbItemModel, ContentLayout } from '../../../../lib'
import { useGamificationBreadcrumb } from '../../game-lib'

import styles from './CreateBadgePage.module.scss'

const CreateBadgePage: FC = () => {

    const breadcrumb: Array<BreadcrumbItemModel> = useGamificationBreadcrumb([
        {
            name: 'create badge',
            url: '#',
        },
    ])

    return (
        <ContentLayout
            contentClass={styles['contentLayout']}
            outerClass={styles['contentLayout-outer']}
            innerClass={styles['contentLayout-inner']}
            title='Create Badge'
        >
            <Breadcrumb items={breadcrumb} />
            <div className={styles.container}>

            </div>
        </ContentLayout>
    )
}

export default CreateBadgePage
