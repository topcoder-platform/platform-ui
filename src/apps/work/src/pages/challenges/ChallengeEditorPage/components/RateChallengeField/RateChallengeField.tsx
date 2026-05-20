import {
    FC,
    useCallback,
    useEffect,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import { FormCheckboxField } from '../../../../../lib/components/form'
import {
    getMetadataValue,
    removeMetadataValue,
    setMetadataValue,
} from '../../../../../lib/utils/metadata.utils'
import {
    ChallengeEditorFormData,
    ChallengeMetadata,
} from '../../../../../lib/models'

const IS_RATED_FIELD = 'isRated'
const IS_RATED_TOGGLE_FIELD = 'isRatedToggle'

interface RateChallengeFormData extends ChallengeEditorFormData {
    isRatedToggle?: boolean
}

/**
 * Resolves whether a challenge should be treated as rated from metadata.
 *
 * @param metadata challenge metadata entries currently held by the editor form.
 * @returns `false` only when the `isRated` metadata entry is explicitly `false`;
 * otherwise challenges stay rated by default.
 * @throws Does not throw.
 */
function isRatedMetadataEnabled(metadata: ChallengeMetadata[] | undefined): boolean {
    return getMetadataValue(metadata, IS_RATED_FIELD)
        ?.trim()
        .toLowerCase() !== 'false'
}

/**
 * Renders the challenge rating opt-out control backed by challenge metadata.
 *
 * Missing `isRated` metadata defaults to rated, so the saved challenge only
 * needs an explicit `isRated=false` entry when the user opts out.
 *
 * @returns The rated challenge checkbox used by the challenge editor.
 * @throws Does not throw.
 */
export const RateChallengeField: FC = () => {
    const formContext = useFormContext<RateChallengeFormData>()
    const metadata = useWatch({
        control: formContext.control,
        name: 'metadata',
    })
    const isRatedToggle = useWatch({
        control: formContext.control,
        name: IS_RATED_TOGGLE_FIELD,
    })

    const isRated = isRatedMetadataEnabled(metadata)

    useEffect(() => {
        if (isRatedToggle !== undefined) {
            return
        }

        formContext.setValue(
            IS_RATED_TOGGLE_FIELD,
            isRated,
            {
                shouldDirty: false,
                shouldValidate: false,
            },
        )
    }, [formContext, isRated, isRatedToggle])

    const handleRatedChange = useCallback((checked: boolean): void => {
        if (checked === isRated) {
            return
        }

        formContext.setValue(
            'metadata',
            checked
                ? removeMetadataValue(metadata, IS_RATED_FIELD)
                : setMetadataValue(
                    metadata,
                    IS_RATED_FIELD,
                    'false',
                ),
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        )
    }, [
        formContext,
        isRated,
        metadata,
    ])

    return (
        <FormCheckboxField
            label='Rate this challenge'
            name={IS_RATED_TOGGLE_FIELD}
            onChange={handleRatedChange}
        />
    )
}

export default RateChallengeField
