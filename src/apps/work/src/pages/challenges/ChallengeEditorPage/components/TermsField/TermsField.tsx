import {
    FC,
    useMemo,
} from 'react'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../../lib/components/form'
import { DEFAULT_NDA_UUID } from '../../../../../lib/constants/challenge-editor.constants'
import {
    useFetchTerms,
    UseFetchTermsResult,
} from '../../../../../lib/hooks'

const DEFAULT_NDA_TERM_OPTION: FormSelectOption = {
    label: 'Topcoder NDA',
    value: DEFAULT_NDA_UUID,
}

export const TermsField: FC = () => {
    const {
        isLoading,
        terms,
    }: UseFetchTermsResult = useFetchTerms()

    const options = useMemo<FormSelectOption[]>(
        () => {
            const mappedTerms = terms
                .map(term => ({
                    label: term.title,
                    value: term.id,
                }))

            const hasDefaultNdaOption = mappedTerms
                .some(option => option.value === DEFAULT_NDA_UUID)

            if (hasDefaultNdaOption) {
                return mappedTerms
            }

            return [
                ...mappedTerms,
                DEFAULT_NDA_TERM_OPTION,
            ]
        },
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
