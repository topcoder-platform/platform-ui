/**
 * Common config for ui.
 */

import { InputSelectOption } from '~/libs/ui'

export const CHALLENGE_TYPE_SELECT_OPTIONS: InputSelectOption[] = [
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
export const QUESTION_YES_NO_OPTIONS: InputSelectOption[] = ['Yes', 'No'].map(
    item => ({ label: item, value: item }),
)
export const QUESTION_RESPONSE_OPTIONS: InputSelectOption[] = [
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
