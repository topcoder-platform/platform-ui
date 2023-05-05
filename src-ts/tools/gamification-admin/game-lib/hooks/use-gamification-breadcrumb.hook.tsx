import { BreadcrumbItemModel } from '../../../../lib'
import { toolTitle } from '../../GamificationAdmin'
import { rootRoute } from '../../gamification-admin.routes'

export function useGamificationBreadcrumb(items: Array<BreadcrumbItemModel>): Array<BreadcrumbItemModel> {

    const breadcrumb: Array<BreadcrumbItemModel> = [
        {
            name: toolTitle,
            url: rootRoute,
        },
        ...items,
    ]

    return breadcrumb
}
