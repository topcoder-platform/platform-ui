export interface TabsNavItem {
    badges?: Array<{
        count: number
        type: 'info' | 'important'
    }>
    id: string
    title: string
}
