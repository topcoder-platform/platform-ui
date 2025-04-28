/**
 * Common config for ui.
 */

import { SelectOption } from '../lib/models'

export const CHALLENGE_TYPE_SELECT_OPTIONS: SelectOption[] = [
    {
        label: 'All',
        value: '',
    },
    ...[
        'Design',
        'Code',
        'Bug Hunt',
        'Test Suite',
        'Copilot Opportunity',
        'Marathon Match',
        'First2Finish',
        'Other',
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

export const MOCKHANDLE = 'stevenfrog'
export const REVIEWCOUNT = 3
