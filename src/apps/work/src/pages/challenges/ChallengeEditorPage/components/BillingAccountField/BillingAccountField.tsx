import {
    FC,
    useMemo,
} from 'react'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../../lib/components/form'
import {
    useFetchBillingAccounts,
    UseFetchBillingAccountsResult,
} from '../../../../../lib/hooks'

interface BillingAccountFieldProps {
    disabled?: boolean
    name: string
    required?: boolean
}

export const BillingAccountField: FC<BillingAccountFieldProps> = (
    props: BillingAccountFieldProps,
) => {
    const {
        billingAccounts,
        error,
        isError,
        isLoading,
    }: UseFetchBillingAccountsResult = useFetchBillingAccounts()

    const options = useMemo<FormSelectOption[]>(
        () => billingAccounts.map(account => ({
            label: account.name,
            value: String(account.id),
        })),
        [billingAccounts],
    )

    const hint = useMemo(() => {
        if (isLoading) {
            return 'Loading billing accounts...'
        }

        if (isError) {
            return error?.message || 'Failed to load billing accounts.'
        }

        return undefined
    }, [
        error,
        isError,
        isLoading,
    ])

    return (
        <FormSelectField
            disabled={props.disabled || isLoading}
            hint={hint}
            label='Billing Account'
            name={props.name}
            options={options}
            placeholder='Select billing account'
            required={props.required}
        />
    )
}

export default BillingAccountField
