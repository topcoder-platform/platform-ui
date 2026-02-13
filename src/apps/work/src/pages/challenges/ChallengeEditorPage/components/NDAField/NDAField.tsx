import {
    FC,
    useCallback,
    useEffect,
    useMemo,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import {
    FormRadioGroup,
    FormRadioOption,
} from '../../../../../lib/components/form'
import { DEFAULT_NDA_UUID } from '../../../../../lib/constants/challenge-editor.constants'
import { ChallengeEditorFormData } from '../../../../../lib/models'

const ndaOptions: FormRadioOption<boolean>[] = [
    {
        label: 'Yes',
        value: true,
    },
    {
        label: 'No',
        value: false,
    },
]

export const NDAField: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const dynamicFormControl = formContext.control as any
    const terms = useWatch({
        control: dynamicFormControl,
        name: 'terms',
    }) as string[] | undefined
    const ndaRequired = useWatch({
        control: dynamicFormControl,
        name: 'ndaRequired',
    }) as boolean | undefined

    const normalizedTerms = useMemo(
        () => (Array.isArray(terms)
            ? terms
            : []),
        [terms],
    )
    const hasNdaTerm = normalizedTerms.includes(DEFAULT_NDA_UUID)

    useEffect(() => {
        if (ndaRequired === undefined || ndaRequired !== hasNdaTerm) {
            formContext.setValue('ndaRequired' as never, hasNdaTerm as never, {
                shouldDirty: false,
                shouldValidate: false,
            })
        }
    }, [formContext, hasNdaTerm, ndaRequired])

    const handleNdaChange = useCallback(
        (value: boolean | string): void => {
            const isNdaRequired = value === true

            if (isNdaRequired && !hasNdaTerm) {
                formContext.setValue('terms', [
                    ...normalizedTerms,
                    DEFAULT_NDA_UUID,
                ], {
                    shouldDirty: true,
                    shouldValidate: true,
                })
                return
            }

            if (!isNdaRequired && hasNdaTerm) {
                formContext.setValue('terms', normalizedTerms
                    .filter(termId => termId !== DEFAULT_NDA_UUID), {
                    shouldDirty: true,
                    shouldValidate: true,
                })
            }
        },
        [
            formContext,
            hasNdaTerm,
            normalizedTerms,
        ],
    )

    return (
        <FormRadioGroup
            label='NDA Required'
            name='ndaRequired'
            onChange={handleNdaChange}
            options={ndaOptions}
        />
    )
}

export default NDAField
