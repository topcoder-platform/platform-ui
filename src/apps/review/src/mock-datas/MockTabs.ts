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

/**
 * Mock data for the tabs
 */
export const MockTabs = [
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
        tabs: (length: number) => {
            const iterativeReview = Array.from({ length }, (_, i) => {
                if (i === 0) {
                    return {
                        label: 'Iterative Review',
                        value: 'Iterative Review',
                    }
                }

                return {
                    label: `Iterative Review ${i + 1}`,
                    value: `Iterative Review ${i + 1}`,
                }
            })
            return [
                {
                    label: 'Registration',
                    value: 'Registration',
                },
                {
                    label: 'Submission / Screening',
                    value: 'Submission / Screening',
                },
                ...iterativeReview,
                {
                    label: 'Winners',
                    value: 'Winners',
                },
            ]
        },
    },
]
