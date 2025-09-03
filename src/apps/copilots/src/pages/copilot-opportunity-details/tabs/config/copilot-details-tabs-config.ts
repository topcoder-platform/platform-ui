import { TabsNavItem } from '~/libs/ui'

export enum CopilotDetailsTabViews {
    details = '0',
    applications = '1',
}

export const getCopilotDetailsTabsConfig = (count: number): TabsNavItem[] => ([
    {
        id: CopilotDetailsTabViews.details,
        title: 'Details',
    },
    {
        badges: [{
            count,
            type: 'info',
        }],
        id: CopilotDetailsTabViews.applications,
        title: 'Applications',
    },
])

export const CopilotDetailsTabsConfig: TabsNavItem[] = [
    {
        id: CopilotDetailsTabViews.details,
        title: 'Details',
    },
    {
        id: CopilotDetailsTabViews.applications,
        title: 'Applications',
    },
]

export function getHashFromTabId(tabId: string): string {
    switch (tabId) {
        case CopilotDetailsTabViews.details:
            return '#details'
        case CopilotDetailsTabViews.applications:
            return '#applications'
        default:
            return '#details'
    }
}

export function getTabIdFromHash(hash: string): string {
    switch (hash) {
        case '#details':
            return CopilotDetailsTabViews.details
        case '#applications':
            return CopilotDetailsTabViews.applications
        default:
            return CopilotDetailsTabViews.details
    }
}
