/**
 * Common config for ui.
 */

import { SelectOption } from '../lib/models'

export const DESIGN = 'Design'
export const TRACK_CHALLENGE = 'Challenge'
export const CODE = 'Code'
export const BUG_HUNT = 'Bug Hunt'
export const TEST_SUITE = 'Test Suite'
export const COPILOT_OPPORTUNITY = 'Copilot Opportunity'
export const MARATHON_MATCH = 'Marathon Match'
export const FIRST2FINISH = 'First2Finish'
export const OTHER = 'Other'

export const CHALLENGE_TYPE_SELECT_ALL_OPTION: SelectOption = {
    label: 'All',
    value: '',
}

export const ROLE_SELECT_ALL_OPTION: SelectOption = {
    label: 'All roles',
    value: '',
}

export const REVIEWER_RESOURCE_ROLE_IDS = [
    '318b9c07-079a-42d9-a81f-b96be1dc1099',
    '3970272b-85b4-48d8-8439-672b4f6031bd',
    '3eedd4a4-3c68-4f68-8de4-a1ca5c2055e5',
    '4857fd2e-d9d2-44bb-a429-f75b7c5d5feb',
    'ac953811-8268-403a-ac06-fd88a100c9c7',
    'caf7b717-3dee-41e0-8bf8-3217cc5a878c',
    'e0544b94-6420-4afc-8f63-238eddc751b9',
    'f6df7212-b9d6-4193-bfb1-b383586fce63',
]

export const COPILOT_RESOURCE_ROLE_ID = 'cfe12b3f-2a24-4639-9d8b-ec86726f76bd'
export const SUBMITTER_RESOURCE_ROLE_ID = '732339e7-8e30-49d7-9198-cccf9451e221'

export const PAST_CHALLENGE_ROLE_SELECT_OPTIONS: SelectOption[] = [
    ROLE_SELECT_ALL_OPTION,
    {
        label: 'Reviewer',
        value: REVIEWER_RESOURCE_ROLE_IDS.join(','),
    },
    {
        label: 'Copilot',
        value: COPILOT_RESOURCE_ROLE_ID,
    },
    {
        label: 'Submitter',
        value: SUBMITTER_RESOURCE_ROLE_ID,
    },
]

export const CHALLENGE_TYPE_SELECT_OPTIONS: SelectOption[] = [
    CHALLENGE_TYPE_SELECT_ALL_OPTION,
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
export const TABLE_DATE_FORMAT = 'MMM DD YYYY, HH:mm A'
export const TABLE_PAGINATION_ITEM_PER_PAGE = 100
export const THRESHOLD_SHORT_TIME = 2 * 60 * 60 * 1000 // in miliseconds

export const ORDINAL_SUFFIX = new Map([[1, '1st'], [2, '2nd'], [3, '3rd']])

export const REVIEWER = 'Reviewer'
export const SUBMITTER = 'Submitter'
export const COPILOT = 'Copilot'
export const ADMIN = 'Admin'
export const MANAGER = 'Manager'

export const MOCKHANDLE = 'stevenfrog'
export const REVIEWCOUNT = 3

export const ITERATIVE_REVIEW = 'Iterative Review'
export const APPROVAL = 'Approval'
export const WINNERS = 'Winners'

export const TAB = 'tab'
export const FINISHTAB = [WINNERS]
export const WITHOUT_APPEAL = [DESIGN, FIRST2FINISH]

export const NO_RESOURCE_ID = 'noResource'
