import {
    FC,
    useCallback,
    useMemo,
} from 'react'
import type {
    UseFormReturn,
} from 'react-hook-form'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import {
    FormFieldWrapper,
    PrizeInput,
} from '../../../../../lib/components/form'
import {
    PRIZE_SET_TYPES,
    PRIZE_TYPES,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    ChallengeEditorFormData,
    PrizeSet,
} from '../../../../../lib/models'

import { updateOptionalSinglePrizeSet } from './CopilotFeeField.utils'

interface CopilotFeeFieldProps {
    disabled?: boolean
    name: 'prizeSets'
}

export const CopilotFeeField: FC<CopilotFeeFieldProps> = (
    props: CopilotFeeFieldProps,
) => {
    const formContext: UseFormReturn<ChallengeEditorFormData> = useFormContext<ChallengeEditorFormData>()
    const control = formContext.control
    const getValues = formContext.getValues
    const setValue = formContext.setValue
    const watchedPrizeSets = useWatch<ChallengeEditorFormData, 'prizeSets'>({
        control,
        name: props.name,
    })

    const prizeSets = useMemo<PrizeSet[]>(
        () => (Array.isArray(watchedPrizeSets) ? watchedPrizeSets : []),
        [watchedPrizeSets],
    )
    const copilotFeeValue = Number(
        prizeSets.find(prizeSet => prizeSet.type === PRIZE_SET_TYPES.COPILOT)
            ?.prizes?.[0]
            ?.value,
    ) || 0

    const handleValueChange = useCallback(
        (nextValue: number): void => {
            const currentPrizeSets = getValues(props.name)
            const nextPrizeSets = updateOptionalSinglePrizeSet(
                Array.isArray(currentPrizeSets) ? currentPrizeSets : [],
                PRIZE_SET_TYPES.COPILOT,
                PRIZE_TYPES.USD,
                nextValue,
            )

            setValue(props.name, nextPrizeSets, {
                shouldDirty: true,
                shouldValidate: true,
            })
        },
        [
            getValues,
            props.name,
            setValue,
        ],
    )

    return (
        <FormFieldWrapper
            label='Copilot Fee'
            name={props.name}
        >
            <PrizeInput
                disabled={props.disabled}
                onChange={handleValueChange}
                prizeType={PRIZE_TYPES.USD}
                value={copilotFeeValue}
            />
        </FormFieldWrapper>
    )
}

export default CopilotFeeField
