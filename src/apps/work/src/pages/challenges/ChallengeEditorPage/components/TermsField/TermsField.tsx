import {
    FC,
    useMemo,
} from 'react'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../../lib/components/form'
import {
    useFetchTerms,
    UseFetchTermsResult,
} from '../../../../../lib/hooks'

export const TermsField: FC = () => {
    const {
        isLoading,
        terms,
    }: UseFetchTermsResult = useFetchTerms()

    const options = useMemo<FormSelectOption[]>(
        () => terms
            .map(term => ({
                label: term.title,
                value: term.id,
            })),
        [terms],
    )

    return (
        <FormSelectField
            disabled={isLoading}
            isMulti
            label='Terms'
            name='terms'
            options={options}
            placeholder='Select terms'
        />
    )
}

export default TermsField
