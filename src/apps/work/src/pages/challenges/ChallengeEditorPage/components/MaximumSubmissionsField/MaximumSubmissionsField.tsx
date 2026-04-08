import {
    FC,
    useEffect,
    useMemo,
    useRef,
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

interface MaximumSubmissionsFieldProps {
    /**
     * Defers dirtying the form while the editor is still restoring persisted assignments.
     * Once hydration finishes, the normalized metadata is marked dirty so save/autosave
     * still persists the unlimited-only payload.
     */
    deferDirty?: boolean
}

/**
 * Normalizes design-challenge submission metadata to unlimited submissions.
 *
 * The work app no longer exposes the legacy submission-cap UI, but challenge drafts still
 * persist the `submissionLimit` metadata entry. This component keeps that legacy metadata in
 * sync with the unlimited-only payload while rendering no visible controls, and it can defer
 * dirtying until the form finishes its initial resource hydration so copilot restoration is
 * not blocked by the automatic normalization.
 *
 * @param props component options.
 * @returns an empty fragment; submission limits are no longer editable in the design challenge editor.
 */
export const MaximumSubmissionsField: FC<MaximumSubmissionsFieldProps> = (
    props: MaximumSubmissionsFieldProps,
) => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const dynamicFormControl = formContext.control as any
    const deferredDirtyNormalizationRef = useRef(false)
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

        deferredDirtyNormalizationRef.current = props.deferDirty === true

        formContext.setValue(
            'metadata',
            setMetadataValue(
                metadata,
                SUBMISSION_LIMIT_FIELD,
                UNLIMITED_SUBMISSION_LIMIT_PAYLOAD,
            ),
            {
                shouldDirty: props.deferDirty !== true,
                shouldValidate: true,
            },
        )
    }, [
        formContext,
        metadata,
        props.deferDirty,
        submissionLimitValue,
    ])

    useEffect(() => {
        if (
            props.deferDirty
            || !deferredDirtyNormalizationRef.current
            || submissionLimitValue !== UNLIMITED_SUBMISSION_LIMIT_PAYLOAD
        ) {
            return
        }

        deferredDirtyNormalizationRef.current = false

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
        props.deferDirty,
        submissionLimitValue,
    ])

    return <></>
}

export default MaximumSubmissionsField
