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
    booleanToMetadata,
    metadataToBoolean,
} from '../../../../../lib/utils'
import {
    ChallengeEditorFormData,
    ChallengeMetadata,
} from '../../../../../lib/models'

const ALLOW_STOCK_ART_FIELD = 'allowStockArt'
const ALLOW_STOCK_ART_TOGGLE_FIELD = 'allowStockArtToggle'

export const StockArtsField: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const dynamicFormControl = formContext.control as any
    const metadata = useWatch({
        control: dynamicFormControl,
        name: 'metadata',
    }) as ChallengeMetadata[] | undefined
    const allowStockArtToggle = useWatch({
        control: dynamicFormControl,
        name: ALLOW_STOCK_ART_TOGGLE_FIELD,
    }) as boolean | undefined

    const isStockArtAllowed = metadataToBoolean(metadata, ALLOW_STOCK_ART_FIELD)

    useEffect(() => {
        if (allowStockArtToggle !== undefined) {
            return
        }

        formContext.setValue(
            ALLOW_STOCK_ART_TOGGLE_FIELD as never,
            isStockArtAllowed as never,
            {
                shouldDirty: false,
                shouldValidate: false,
            },
        )
    }, [allowStockArtToggle, formContext, isStockArtAllowed])

    const handleAllowStockArtChange = useCallback((checked: boolean): void => {
        if (checked === isStockArtAllowed) {
            return
        }

        formContext.setValue(
            'metadata',
            booleanToMetadata(
                metadata,
                ALLOW_STOCK_ART_FIELD,
                checked,
            ),
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        )
    }, [
        formContext,
        isStockArtAllowed,
        metadata,
    ])

    return (
        <FormCheckboxField
            label='Is stock photography allowed?'
            name={ALLOW_STOCK_ART_TOGGLE_FIELD}
            onChange={handleAllowStockArtChange}
        />
    )
}

export default StockArtsField
