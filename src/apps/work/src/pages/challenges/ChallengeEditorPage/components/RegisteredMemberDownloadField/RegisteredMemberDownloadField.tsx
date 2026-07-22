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
    ChallengeEditorFormData,
    ChallengeMetadata,
} from '../../../../../lib/models'
import {
    booleanToMetadata,
    metadataToBoolean,
} from '../../../../../lib/utils/metadata.utils'

const REGISTERED_MEMBER_DOWNLOAD_METADATA_FIELD = 'allowAllRegistrantsToDownloadWinningSubmissions'
const REGISTERED_MEMBER_DOWNLOAD_TOGGLE_FIELD = 'allowAllRegistrantsToDownloadWinningSubmissionsToggle'

interface RegisteredMemberDownloadFormData extends ChallengeEditorFormData {
    allowAllRegistrantsToDownloadWinningSubmissionsToggle?: boolean
}

/**
 * Renders the challenge setting that expands winning-submission downloads to every registrant.
 *
 * The setting defaults to disabled when its metadata entry is absent and persists an exact string
 * boolean when changed. It intentionally leaves Design's separate `submissionsViewable` metadata
 * untouched so that visibility gate can continue to take precedence.
 *
 * @returns The registered-member winning-submission download checkbox.
 * @throws Does not throw.
 */
export const RegisteredMemberDownloadField: FC = () => {
    const formContext = useFormContext<RegisteredMemberDownloadFormData>()
    const metadata = useWatch({
        control: formContext.control,
        name: 'metadata',
    }) as ChallengeMetadata[] | undefined
    const registeredMemberDownloadToggle = useWatch({
        control: formContext.control,
        name: REGISTERED_MEMBER_DOWNLOAD_TOGGLE_FIELD,
    })

    const isRegisteredMemberDownloadAllowed = metadataToBoolean(
        metadata,
        REGISTERED_MEMBER_DOWNLOAD_METADATA_FIELD,
    )

    useEffect(() => {
        if (registeredMemberDownloadToggle !== undefined) {
            return
        }

        formContext.setValue(
            REGISTERED_MEMBER_DOWNLOAD_TOGGLE_FIELD,
            isRegisteredMemberDownloadAllowed,
            {
                shouldDirty: false,
                shouldValidate: false,
            },
        )
    }, [
        formContext,
        isRegisteredMemberDownloadAllowed,
        registeredMemberDownloadToggle,
    ])

    const handleRegisteredMemberDownloadChange = useCallback((checked: boolean): void => {
        if (checked === isRegisteredMemberDownloadAllowed) {
            return
        }

        formContext.setValue(
            'metadata',
            booleanToMetadata(
                metadata,
                REGISTERED_MEMBER_DOWNLOAD_METADATA_FIELD,
                checked,
            ),
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        )
    }, [
        formContext,
        isRegisteredMemberDownloadAllowed,
        metadata,
    ])

    return (
        <FormCheckboxField
            checkboxOnlyHitArea
            label='Allow all registered members to download winning submissions after challenge ends'
            name={REGISTERED_MEMBER_DOWNLOAD_TOGGLE_FIELD}
            onChange={handleRegisteredMemberDownloadChange}
        />
    )
}

export default RegisteredMemberDownloadField
