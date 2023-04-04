import { FC } from 'react'

import { Breadcrumb, BreadcrumbItemModel } from '../../../../../lib'
import { WorkType } from '../../../work-lib'
import { dashboardRoute, selfServiceStartRoute } from '../../../work.routes'

interface IntakeFormsBreadcrumbProps {
    basicInfoRoute: string,
    reviewRoute?: string,
    workType: WorkType,
}

const IntakeFormsBreadcrumb: FC<IntakeFormsBreadcrumbProps> = props => {
    const breadcrumbs: Array<BreadcrumbItemModel> = [
        { name: 'My Work', url: dashboardRoute },
        { name: 'Start Work', url: selfServiceStartRoute },
        { name: props.workType, url: props.basicInfoRoute },
    ]

    if (props.reviewRoute) {
        breadcrumbs.push(
            { name: 'Review & Payment', url: props.reviewRoute },
        )
    }

    return (
        <Breadcrumb items={breadcrumbs} />
    )
}

export default IntakeFormsBreadcrumb
