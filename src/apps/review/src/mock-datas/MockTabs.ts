import {
    BUG_HUNT,
    CODE,
    COPILOT_OPPORTUNITY,
    DESIGN,
    FIRST2FINISH,
    MARATHON_MATCH,
    OTHER,
    TEST_SUITE,
} from '../config/index.config'
import type { SelectOption } from '../lib/models'

type TabsFactory = (tabsLength?: number) => SelectOption[]

type MockTabsConfig = {
    name: string
    tabs: SelectOption[] | TabsFactory
}

/**
 * Mock data for the tabs
 */
export const MockTabs: MockTabsConfig[] = [
    {
        name: `${CODE} ${BUG_HUNT} ${TEST_SUITE} ${COPILOT_OPPORTUNITY} ${MARATHON_MATCH} ${OTHER}`,
        tabs: [
            {
                label: 'Registration',
                value: 'Registration',
            },
            {
                label: 'Submission / Screening',
                value: 'Submission / Screening',
            },
            {
                label: 'Review / Appeals',
                value: 'Review / Appeals',
            },
            {
                label: 'Winners',
                value: 'Winners',
            },
        ],
    },
    {
        name: `${DESIGN}`,
        tabs: [
            {
                label: 'Registration',
                value: 'Registration',
            },
            {
                label: 'Submission / Screening',
                value: 'Submission / Screening',
            },
            {
                label: 'Review',
                value: 'Review',
            },
            {
                label: 'Approval',
                value: 'Approval',
            },
            {
                label: 'Winners',
                value: 'Winners',
            },
        ],
    },
    {
        name: `${FIRST2FINISH}`,
        tabs: () => [
            {
                label: 'Registration',
                value: 'Registration',
            },
            {
                label: 'Submission / Screening',
                value: 'Submission / Screening',
            },
            {
                label: 'Iterative Review',
                value: 'Iterative Review',
            },
            {
                label: 'Winners',
                value: 'Winners',
            },
        ],
    },
]
