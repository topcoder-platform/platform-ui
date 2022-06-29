export interface BreadcrumbItemModel {
    isElipsis?: boolean
    name: string
    onClick?: (item: BreadcrumbItemModel) => void
    url: string
}
