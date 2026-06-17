import {
    FC,
    useEffect,
    useMemo,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../../lib/components/form'
import {
    DEFAULT_NDA_UUID,
    DEFAULT_STANDARD_TERMS_UUID,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    useFetchTerms,
    UseFetchTermsResult,
} from '../../../../../lib/hooks'
import {
    ChallengeEditorFormData,
    Term,
} from '../../../../../lib/models'

const DEFAULT_NDA_TERM_OPTION: FormSelectOption = {
    label: 'Topcoder NDA',
    value: DEFAULT_NDA_UUID,
}

const LEGACY_DEFAULT_STANDARD_TERM_IDS = new Set([
    '317cd8f9-d66c-4f2a-8774-63c612d99cd4',
    '564a981e-6840-4a5c-894e-d5ad22e9cd6f',
])

const DEFAULT_STANDARD_TERM_TITLES = new Set([
    'standard terms v3',
    'terms & conditions of use at topcoder',
    'terms and conditions of use at topcoder',
])

function normalizeTermTitle(value: string): string {
    return value
        .trim()
        .toLowerCase()
}

export function findDefaultStandardTermId(
    terms: Term[],
    configuredDefaultTermId: string | undefined = DEFAULT_STANDARD_TERMS_UUID,
): string | undefined {
    const normalizedConfiguredDefaultTermId = configuredDefaultTermId?.trim()

    if (
        normalizedConfiguredDefaultTermId
        && terms.some(term => term.id === normalizedConfiguredDefaultTermId)
    ) {
        return normalizedConfiguredDefaultTermId
    }

    // Keep legacy discovery as a fallback until every environment has an explicit default UUID.
    return terms.find(term => (
        LEGACY_DEFAULT_STANDARD_TERM_IDS.has(term.id)
        || DEFAULT_STANDARD_TERM_TITLES.has(normalizeTermTitle(term.title))
    ))?.id
}

interface TermsFieldProps {
    shouldDefaultStandardTerm?: boolean
}

export const TermsField: FC<TermsFieldProps> = (props: TermsFieldProps) => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const dynamicFormControl = formContext.control as any
    const selectedTerms = useWatch({
        control: dynamicFormControl,
        name: 'terms',
    }) as string[] | undefined
    const {
        isLoading,
        terms,
    }: UseFetchTermsResult = useFetchTerms()
    const normalizedSelectedTerms = useMemo(
        () => (Array.isArray(selectedTerms)
            ? selectedTerms
                .filter((termId): termId is string => typeof termId === 'string' && termId.trim().length > 0)
            : []),
        [selectedTerms],
    )
    const defaultStandardTermId = useMemo(
        () => findDefaultStandardTermId(terms),
        [terms],
    )

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

    useEffect(() => {
        if (
            props.shouldDefaultStandardTerm === false
            || !defaultStandardTermId
            || normalizedSelectedTerms.includes(defaultStandardTermId)
        ) {
            return
        }

        formContext.setValue(
            'terms',
            Array.from(new Set([
                ...normalizedSelectedTerms,
                defaultStandardTermId,
            ])),
            {
                shouldDirty: false,
                shouldValidate: false,
            },
        )
    }, [
        defaultStandardTermId,
        formContext,
        normalizedSelectedTerms,
        props.shouldDefaultStandardTerm,
    ])

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
