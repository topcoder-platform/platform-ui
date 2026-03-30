import {
    FC,
    useEffect,
} from 'react'
import type {
    UseFormReturn,
} from 'react-hook-form'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import {
    FormRadioGroup,
    FormUserAutocomplete,
} from '../../../../../lib/components/form'
import { REVIEW_TYPES } from '../../../../../lib/constants/challenge-editor.constants'
import { ChallengeEditorFormData } from '../../../../../lib/models'

import styles from './ReviewTypeField.module.scss'

interface ReviewTypeFieldProps {
    isTaskChallenge: boolean
}

const taskReviewTypeOptions = [
    {
        label: 'Internal',
        value: REVIEW_TYPES.INTERNAL,
    },
]

function normalizeText(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim()
}

export const ReviewTypeField: FC<ReviewTypeFieldProps> = (
    props: ReviewTypeFieldProps,
) => {
    const {
        control,
        setValue,
    }: Pick<UseFormReturn<ChallengeEditorFormData>, 'control' | 'setValue'> = useFormContext<ChallengeEditorFormData>()
    const reviewType = useWatch({
        control,
        name: 'legacy.reviewType',
    }) as string | undefined

    useEffect(() => {
        if (!props.isTaskChallenge) {
            return
        }

        if (normalizeText(reviewType)
            .toUpperCase() === REVIEW_TYPES.INTERNAL
        ) {
            return
        }

        setValue('legacy.reviewType', REVIEW_TYPES.INTERNAL, {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [
        props.isTaskChallenge,
        reviewType,
        setValue,
    ])

    if (!props.isTaskChallenge) {
        return <></>
    }

    return (
        <div className={styles.container}>
            <FormRadioGroup
                disabled
                label='Review Type'
                name='legacy.reviewType'
                options={taskReviewTypeOptions}
                required
            />
            <FormUserAutocomplete
                label='Reviewer'
                name='reviewer'
                placeholder='Search reviewer'
                required
            />
        </div>
    )
}

export default ReviewTypeField
