/**
 * Common config for ui.
 */

import { SelectOption } from '../lib/models'

export const DESIGN = 'Design'
export const CODE = 'Code'
export const BUG_HUNT = 'Bug Hunt'
export const TEST_SUITE = 'Test Suite'
export const COPILOT_OPPORTUNITY = 'Copilot Opportunity'
export const MARATHON_MATCH = 'Marathon Match'
export const FIRST2FINISH = 'First2Finish'
export const OTHER = 'Other'

export const CHALLENGE_TYPE_SELECT_OPTIONS: SelectOption[] = [
    {
        label: 'All',
        value: '',
    },
    ...[
        DESIGN,
        CODE,
        BUG_HUNT,
        TEST_SUITE,
        COPILOT_OPPORTUNITY,
        MARATHON_MATCH,
        FIRST2FINISH,
        OTHER,
    ].map(item => ({ label: item, value: item })),
]
export const QUESTION_YES_NO_OPTIONS: SelectOption[] = ['Yes', 'No'].map(
    item => ({ label: item, value: item }),
)
export const QUESTION_RESPONSE_OPTIONS: SelectOption[] = [
    {
        label: 'Comment',
        value: 'COMMENT',
    },
    {
        label: 'Required',
        value: 'REQUIRED',
    },
    {
        label: 'Recommended',
        value: 'RECOMMENDED',
    },
]
export const QUESTION_RESPONSE_TYPE_MAPPING_DISPLAY: { [key: string]: string }
= {
    COMMENT: 'Comment',
    RECOMMENDED: 'Recommended',
    REQUIRED: 'Required',
}
export const TABLE_DATE_FORMAT = 'MMM DD, HH:mm A'
export const THRESHOLD_SHORT_TIME = 2 * 60 * 60 * 1000 // in miliseconds

export const ORDINAL_SUFFIX = new Map([[1, '1st'], [2, '2nd'], [3, '3rd']])

export const REVIEWER = 'Reviewer'
export const SUBMITTER = 'Submitter'
export const COPILOT = 'Copilot'
export const ADMIN = 'Admin'

export const MOCKHANDLE = 'stevenfrog'
export const REVIEWCOUNT = 3

export const ITERATIVE_REVIEW = 'Iterative Review'
export const APPROVAL = 'Approval'
export const WINNERS = 'Winners'

export const TAB = 'tab'
export const FINISHTAB = [WINNERS]
export const WITHOUT_APPEAL = [DESIGN, FIRST2FINISH]
