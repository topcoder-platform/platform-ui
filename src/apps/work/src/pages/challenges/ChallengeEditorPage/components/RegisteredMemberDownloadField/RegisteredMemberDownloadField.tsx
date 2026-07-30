import {
    FC,
    useCallback,
    useEffect,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import {
    FormRadioGroup,
    FormRadioOption,
} from '../../../../../lib/components/form'
import {
    ChallengeEditorFormData,
    ChallengeMetadata,
} from '../../../../../lib/models'
import {
    booleanToMetadata,
    metadataToBoolean,
} from '../../../../../lib/utils/metadata.utils'

export const REGISTERED_MEMBER_DOWNLOAD_METADATA_FIELD = 'allowAllRegistrantsToDownloadWinningSubmissions'
const REGISTERED_MEMBER_DOWNLOAD_TOGGLE_FIELD = 'allowAllRegistrantsToDownloadWinningSubmissionsToggle'

interface RegisteredMemberDownloadFormData extends ChallengeEditorFormData {
    allowAllRegistrantsToDownloadWinningSubmissionsToggle?: boolean
}

const registeredMemberDownloadOptions: FormRadioOption<boolean>[] = [
    {
        label: 'All challenge registrants - anyone who registered, whether or not they submitted',
        value: true,
    },
    {
        label: 'Passing submitters only - members who submitted and passed review',
        value: false,
    },
]

/**
 * Renders the winning-submission download access setting.
 *
 * Existing challenges without metadata retain the restricted passing-submitter behavior. New
 * challenges receive explicit allow-all metadata during creation, and changes persist exact string
 * booleans for the Review API authorization contract.
 *
 * @returns The winning-submission download access radio group.
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

    const handleRegisteredMemberDownloadChange = useCallback((value: boolean | string): void => {
        const checked = value === true || value === 'true'

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
        <FormRadioGroup
            label='Winning submissions download access:'
            name={REGISTERED_MEMBER_DOWNLOAD_TOGGLE_FIELD}
            onChange={handleRegisteredMemberDownloadChange}
            options={registeredMemberDownloadOptions}
        />
    )
}

export default RegisteredMemberDownloadField
