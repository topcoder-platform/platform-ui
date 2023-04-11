import { BreadcrumbItemModel } from '~/libs/ui'

import { basePath } from '../../gamification-admin.routes'
import { toolTitle } from '../../GamificationAdmin'

export function useGamificationBreadcrumb(items: Array<BreadcrumbItemModel>): Array<BreadcrumbItemModel> {

    const breadcrumb: Array<BreadcrumbItemModel> = [
        {
            name: toolTitle,
            url: basePath,
        },
        ...items,
    ]

    return breadcrumb
}
