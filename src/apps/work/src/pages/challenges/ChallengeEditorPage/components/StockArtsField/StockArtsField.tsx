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
        if (allowStockArtToggle === undefined || allowStockArtToggle !== isStockArtAllowed) {
            formContext.setValue(
                ALLOW_STOCK_ART_TOGGLE_FIELD as never,
                isStockArtAllowed as never,
                {
                    shouldDirty: false,
                    shouldValidate: false,
                },
            )
        }
    }, [allowStockArtToggle, formContext, isStockArtAllowed])

    useEffect(() => {
        if (typeof allowStockArtToggle !== 'boolean') {
            return
        }

        if (allowStockArtToggle === isStockArtAllowed) {
            return
        }

        formContext.setValue(
            'metadata',
            booleanToMetadata(
                metadata,
                ALLOW_STOCK_ART_FIELD,
                allowStockArtToggle,
            ),
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        )
    }, [
        allowStockArtToggle,
        formContext,
        isStockArtAllowed,
        metadata,
    ])

    return (
        <FormCheckboxField
            label='Is stock photography allowed?'
            name={ALLOW_STOCK_ART_TOGGLE_FIELD}
        />
    )
}

export default StockArtsField
