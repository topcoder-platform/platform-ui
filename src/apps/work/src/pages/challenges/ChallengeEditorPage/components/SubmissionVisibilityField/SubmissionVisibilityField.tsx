import {
    FC,
    useEffect,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import { FormCheckboxField } from '../../../../../lib/components/form'
import {
    booleanToMetadata,
    metadataToBoolean,
} from '../../../../../lib/utils'
import {
    ChallengeEditorFormData,
    ChallengeMetadata,
} from '../../../../../lib/models'

const SUBMISSIONS_VIEWABLE_FIELD = 'submissionsViewable'
const SUBMISSIONS_VIEWABLE_TOGGLE_FIELD = 'submissionsViewableToggle'

export const SubmissionVisibilityField: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const dynamicFormControl = formContext.control as any
    const metadata = useWatch({
        control: dynamicFormControl,
        name: 'metadata',
    }) as ChallengeMetadata[] | undefined
    const submissionsViewableToggle = useWatch({
        control: dynamicFormControl,
        name: SUBMISSIONS_VIEWABLE_TOGGLE_FIELD,
    }) as boolean | undefined

    const isSubmissionsViewable = metadataToBoolean(metadata, SUBMISSIONS_VIEWABLE_FIELD)

    useEffect(() => {
        if (submissionsViewableToggle === undefined || submissionsViewableToggle !== isSubmissionsViewable) {
            formContext.setValue(
                SUBMISSIONS_VIEWABLE_TOGGLE_FIELD as never,
                isSubmissionsViewable as never,
                {
                    shouldDirty: false,
                    shouldValidate: false,
                },
            )
        }
    }, [formContext, isSubmissionsViewable, submissionsViewableToggle])

    useEffect(() => {
        if (typeof submissionsViewableToggle !== 'boolean') {
            return
        }

        if (submissionsViewableToggle === isSubmissionsViewable) {
            return
        }

        formContext.setValue(
            'metadata',
            booleanToMetadata(
                metadata,
                SUBMISSIONS_VIEWABLE_FIELD,
                submissionsViewableToggle,
            ),
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        )
    }, [
        formContext,
        isSubmissionsViewable,
        metadata,
        submissionsViewableToggle,
    ])

    return (
        <FormCheckboxField
            label='Submissions are viewable after challenge ends'
            name={SUBMISSIONS_VIEWABLE_TOGGLE_FIELD}
        />
    )
}

export default SubmissionVisibilityField
