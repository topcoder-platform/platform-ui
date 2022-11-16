import React, { FC } from 'react'

import { Breadcrumb, BreadcrumbItemModel } from '../../../../../lib'
import { WorkType } from '../../../work-lib'
import { dashboardRoute, selfServiceStartRoute } from '../../../work.routes'

interface IntakeFormsBreadcrumbProps {
    basicInfoRoute: string,
    reviewRoute?: string,
    workType: WorkType,
}

const IntakeFormsBreadcrumb: FC<IntakeFormsBreadcrumbProps> = ({ basicInfoRoute, reviewRoute, workType }) => {
    const breadcrumbs: Array<BreadcrumbItemModel> = [
        { url: dashboardRoute, name: 'My Work' },
        { url: selfServiceStartRoute, name: 'Start Work' },
        { url: basicInfoRoute, name: workType },
    ]

    if (reviewRoute) {
        breadcrumbs.push(
            { url: reviewRoute, name: 'Review & Payment' },
        )
    }

    return (
        <Breadcrumb items={breadcrumbs} />
    )
}

export default IntakeFormsBreadcrumb
