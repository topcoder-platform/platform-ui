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
    ChallengeEditorFormData,
    ChallengeMetadata,
} from '../../../../../lib/models'
import {
    getMetadataValue,
    setMetadataValue,
} from '../../../../../lib/utils'

const SUBMISSION_LIMIT_FIELD = 'submissionLimit'
const UNLIMITED_SUBMISSION_LIMIT_PAYLOAD = JSON.stringify({
    count: '',
    limit: 'false',
    unlimited: 'true',
})

/**
 * Normalizes design-challenge submission metadata to unlimited submissions.
 *
 * The work app no longer exposes the legacy submission-cap UI, but challenge drafts still
 * persist the `submissionLimit` metadata entry. This component keeps that legacy metadata in
 * sync with the unlimited-only payload while rendering no visible controls.
 *
 * @returns an empty fragment; submission limits are no longer editable in the design challenge editor.
 */
export const MaximumSubmissionsField: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const dynamicFormControl = formContext.control as any
    const metadata = useWatch({
        control: dynamicFormControl,
        name: 'metadata',
    }) as ChallengeMetadata[] | undefined
    const submissionLimitValue = useMemo(
        () => getMetadataValue(metadata, SUBMISSION_LIMIT_FIELD),
        [metadata],
    )

    useEffect(() => {
        if (submissionLimitValue === UNLIMITED_SUBMISSION_LIMIT_PAYLOAD) {
            return
        }

        formContext.setValue(
            'metadata',
            setMetadataValue(
                metadata,
                SUBMISSION_LIMIT_FIELD,
                UNLIMITED_SUBMISSION_LIMIT_PAYLOAD,
            ),
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        )
    }, [
        formContext,
        metadata,
        submissionLimitValue,
    ])

    return <></>
}

export default MaximumSubmissionsField
