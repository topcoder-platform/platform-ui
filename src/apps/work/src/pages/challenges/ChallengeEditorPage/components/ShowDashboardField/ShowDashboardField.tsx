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
    getMetadataValue,
    metadataToBoolean,
} from '../../../../../lib/utils/metadata.utils'

export const SHOW_DATA_DASHBOARD_METADATA_FIELD = 'show_data_dashboard'
const SHOW_DATA_DASHBOARD_TOGGLE_FIELD = 'showDataDashboardToggle'

interface ShowDashboardFieldProps {
    disabled?: boolean
}

/**
 * Renders the Marathon Match data dashboard toggle in the Advanced Options section.
 *
 * Fun challenges default to an enabled dashboard when the challenge has no saved
 * `show_data_dashboard` metadata, matching how Marathon Matches are normally set up. Saved metadata
 * always wins so a copilot can turn the dashboard off again.
 *
 * @param props field state supplied by the challenge editor, including read-only disablement.
 * @returns A checkbox that persists the `show_data_dashboard` challenge metadata flag.
 * @throws Does not throw.
 */
export const ShowDashboardField: FC<ShowDashboardFieldProps> = (props: ShowDashboardFieldProps) => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const dynamicFormControl = formContext.control as any
    const metadata = useWatch({
        control: dynamicFormControl,
        name: 'metadata',
    }) as ChallengeMetadata[] | undefined
    const funChallenge = useWatch({
        control: dynamicFormControl,
        name: 'funChallenge',
    }) as boolean | undefined
    const showDataDashboardToggle = useWatch({
        control: dynamicFormControl,
        name: SHOW_DATA_DASHBOARD_TOGGLE_FIELD,
    }) as boolean | undefined

    const hasSavedDashboardFlag = getMetadataValue(
        metadata,
        SHOW_DATA_DASHBOARD_METADATA_FIELD,
    ) !== undefined
    const isDashboardShown = hasSavedDashboardFlag
        ? metadataToBoolean(metadata, SHOW_DATA_DASHBOARD_METADATA_FIELD)
        : funChallenge === true

    // Persist the fun-challenge default so saving the challenge keeps the dashboard enabled.
    useEffect(() => {
        if (hasSavedDashboardFlag || !isDashboardShown) {
            return
        }

        formContext.setValue(
            'metadata',
            booleanToMetadata(
                metadata,
                SHOW_DATA_DASHBOARD_METADATA_FIELD,
                true,
            ),
            {
                shouldDirty: false,
                shouldValidate: false,
            },
        )
    }, [
        formContext,
        hasSavedDashboardFlag,
        isDashboardShown,
        metadata,
    ])

    useEffect(() => {
        if (showDataDashboardToggle !== undefined) {
            return
        }

        formContext.setValue(
            SHOW_DATA_DASHBOARD_TOGGLE_FIELD as never,
            isDashboardShown as never,
            {
                shouldDirty: false,
                shouldValidate: false,
            },
        )
    }, [
        formContext,
        isDashboardShown,
        showDataDashboardToggle,
    ])

    const handleShowDashboardChange = useCallback((checked: boolean): void => {
        if (hasSavedDashboardFlag && checked === isDashboardShown) {
            return
        }

        formContext.setValue(
            'metadata',
            booleanToMetadata(
                metadata,
                SHOW_DATA_DASHBOARD_METADATA_FIELD,
                checked,
            ),
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        )
    }, [
        formContext,
        hasSavedDashboardFlag,
        isDashboardShown,
        metadata,
    ])

    return (
        <FormCheckboxField
            checkboxOnlyHitArea
            disabled={props.disabled}
            hint='Shows the data dashboard graph on the challenge details page.'
            label='Show Dashboard'
            name={SHOW_DATA_DASHBOARD_TOGGLE_FIELD}
            onChange={handleShowDashboardChange}
        />
    )
}

export default ShowDashboardField
