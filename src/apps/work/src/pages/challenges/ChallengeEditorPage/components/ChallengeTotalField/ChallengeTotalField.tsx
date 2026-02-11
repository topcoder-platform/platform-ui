import {
    FC,
    useMemo,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import { FormFieldWrapper } from '../../../../../lib/components/form'
import {
    ChallengeEditorFormData,
    ChallengeReviewer,
    PrizeSet,
} from '../../../../../lib/models'
import { calculateChallengeTotal } from '../../../../../lib/utils'

import styles from './ChallengeTotalField.module.scss'

export const ChallengeTotalField: FC = () => {
    const formContext: UseFormReturn<ChallengeEditorFormData> = useFormContext<ChallengeEditorFormData>()
    const control = formContext.control
    const prizeSets = useWatch({
        control,
        name: 'prizeSets',
    }) as PrizeSet[] | undefined
    const reviewers = useWatch({
        control,
        name: 'reviewers',
    }) as ChallengeReviewer[] | undefined

    const total = useMemo(
        () => calculateChallengeTotal(prizeSets, reviewers),
        [
            prizeSets,
            reviewers,
        ],
    )

    const formattedValue = useMemo(
        () => `$ ${total.toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        })}`,
        [total],
    )

    return (
        <FormFieldWrapper
            label='Estimated Challenge Total'
            name='estimatedChallengeTotal'
        >
            <div className={styles.value}>{formattedValue}</div>
        </FormFieldWrapper>
    )
}

export default ChallengeTotalField
