import { IconOutline, IconWrapper } from '../../../../lib'
import {
    Work,
    WorkTypeCategory,
    WorkTypeCategoryDataIcon,
    WorkTypeCategoryDesignIcon,
    WorkTypeCategoryUnknownIcon,
} from '../../work-lib'

import styles from './WorkTableTitleRenderer.module.scss'

const WorkTableTitleRenderer = (data: Work): JSX.Element => {

    let Icon: JSX.Element
    switch (data.typeCategory) {

        case WorkTypeCategory.data:
            Icon = <WorkTypeCategoryDataIcon />
            break

        case WorkTypeCategory.design:
            Icon = <WorkTypeCategoryDesignIcon />
            break

        case WorkTypeCategory.qa:
            Icon = (
                <IconWrapper
                    className={styles['qa-icon']}
                    icon={<IconOutline.BadgeCheckIcon />}
                />
            )
            break

        // TODO: dev work categories
        default:
            Icon = <WorkTypeCategoryUnknownIcon />
            break
    }

    return (
        <div className={styles['work-table-title-container']}>
            {Icon}
            <div className={styles['work-table-title']}>
                <div className={styles.title}>
                    {data.title}
                </div>
                <div className={styles.description}>
                    {data.description}
                </div>
            </div>
        </div>
    )
}

export default WorkTableTitleRenderer
