// eslint-disable-next-line max-len
import { InputSelectOption } from '~/libs/ui/lib/components/form/form-groups/form-input/input-select-react/InputSelectReact'

/**
 * Common config for ui.
 */
const EMPTY_OPTION: InputSelectOption = { label: 'all', value: '' }
export const USER_STATUS_SELECT_OPTIONS: InputSelectOption[] = [
    EMPTY_OPTION,
    { label: 'active', value: 'active' },
    { label: 'inactive', value: 'inactive' },
]
export const BILLING_ACCOUNT_STATUS_FILTER_OPTIONS: InputSelectOption[] = [
    { label: 'Select status', value: '' },
    { label: 'Active', value: '1' },
    { label: 'Inactive', value: '0' },
]
export const BILLING_ACCOUNT_STATUS_EDIT_OPTIONS: InputSelectOption[] = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
]
export const BILLING_ACCOUNT_RESOURCE_STATUS_EDIT_OPTIONS: InputSelectOption[]
    = [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
    ]
export const USER_STATUS_DETAIL_SELECT_OPTIONS: InputSelectOption[] = [
    { label: 'Verified', value: 'A' },
    { label: 'Inactive - Duplicate account', value: '5' },
    { label: 'Inactive - Member wanted account removed', value: '4' },
    { label: 'Inactive - Deactivated for cheating', value: '6' },
]
export const DICT_USER_STATUS = {
    4: 'Deactivated(User request)',
    5: 'Deactivated(Duplicate account)',
    6: 'Deactivated(Cheating account)',
    A: 'Verified',
    U: 'Unverified',
}
export const TABLE_DATE_FORMAT = 'MMM DD, YYYY HH:mm'
export const TABLE_PAGINATION_ITEM_PER_PAGE = 25
export const TABLE_USER_TEMRS_PAGINATION_ITEM_PER_PAGE = 10
export const LABEL_EMAIL_STATUS_VERIFIED = 'Verified'
export const LABEL_EMAIL_STATUS_UNVERIFIED = 'Unverified'
export const MSG_NO_RECORD_FOUND = 'No record found.'
