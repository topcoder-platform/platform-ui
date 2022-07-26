import { BreadcrumbItemModel } from '../../../../lib'
import { rootRoute } from '../../learn.routes'

export function useLearnBreadcrumb(items: Array<BreadcrumbItemModel>): Array<BreadcrumbItemModel> {

    const breadcrumb: Array<BreadcrumbItemModel> = [
        {
            name: 'Topcoder Academy',
            url: rootRoute,
        },
        ...items,
    ]

    return breadcrumb
}
