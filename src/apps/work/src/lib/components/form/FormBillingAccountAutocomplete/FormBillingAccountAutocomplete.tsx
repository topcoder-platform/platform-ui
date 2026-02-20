import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useController,
    UseControllerReturn,
    useFormContext,
} from 'react-hook-form'
import AsyncSelect from 'react-select/async'

import {
    AUTOCOMPLETE_DEBOUNCE_TIME_MS,
    AUTOCOMPLETE_MIN_LENGTH,
} from '../../../constants/challenge-editor.constants'
import {
    BillingAccount,
    fetchBillingAccountById,
    searchBillingAccounts,
} from '../../../services'
import { formatDate } from '../../../utils'
import { FormFieldWrapper } from '../FormFieldWrapper'

import styles from './FormBillingAccountAutocomplete.module.scss'

interface FormBillingAccountAutocompleteProps {
    disabled?: boolean
    hint?: string
    label: string
    name: string
    placeholder?: string
    required?: boolean
}

interface BillingAccountOption {
    label: string
    value: string
}

function normalizeOptionalStringValue(value: unknown): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value.trim()

    return normalizedValue || undefined
}

function normalizeBillingAccountId(value: unknown): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value.trim()

    return normalizedValue || undefined
}

function formatBillingAccountStatus(status: string | undefined): string {
    if (!status) {
        return 'Unknown'
    }

    const normalizedStatus = status
        .trim()
        .replace(/_/g, ' ')
        .toLowerCase()

    if (!normalizedStatus) {
        return 'Unknown'
    }

    return normalizedStatus.replace(/\b[a-z]/g, letter => letter.toUpperCase())
}

function getBillingAccountStatus(
    billingAccount: {
        active?: unknown
        status?: unknown
    },
): string | undefined {
    const directStatus = normalizeOptionalStringValue(billingAccount.status)

    if (directStatus) {
        return directStatus
    }

    if (typeof billingAccount.active === 'boolean') {
        return billingAccount.active
            ? 'ACTIVE'
            : 'INACTIVE'
    }

    return undefined
}

function getBillingAccountName(
    billingAccount: {
        name?: unknown
    },
): string {
    return normalizeOptionalStringValue(billingAccount.name) || '-'
}

function getBillingAccountDate(
    billingAccount: {
        endDate?: unknown
        startDate?: unknown
    },
    field: 'startDate' | 'endDate',
): string {
    return formatDate(normalizeOptionalStringValue(billingAccount[field]))
}

function toOption(billingAccount: BillingAccount): BillingAccountOption {
    const status = formatBillingAccountStatus(getBillingAccountStatus(billingAccount))
    const startDate = getBillingAccountDate(billingAccount, 'startDate')
    const endDate = getBillingAccountDate(billingAccount, 'endDate')

    return {
        label: `[${billingAccount.id}] ${getBillingAccountName(billingAccount)} | ${status} | `
            + `${startDate} - ${endDate}`,
        value: String(billingAccount.id),
    }
}

function createFallbackOption(
    billingAccountId: string,
): BillingAccountOption {
    return {
        label: `[${billingAccountId}] ${billingAccountId}`,
        value: billingAccountId,
    }
}

function mergeOptions(
    optionSet: BillingAccountOption[],
    nextOptions: BillingAccountOption[],
): BillingAccountOption[] {
    const optionMap = new Map<string, BillingAccountOption>()

    optionSet.forEach(option => {
        optionMap.set(option.value, option)
    })

    nextOptions.forEach(option => {
        optionMap.set(option.value, option)
    })

    return Array.from(optionMap.values())
}

function createDebouncedLoader(
    loader: (value: string) => Promise<BillingAccountOption[]>,
): (value: string) => Promise<BillingAccountOption[]> {
    let timeoutId: number | undefined

    return (value: string): Promise<BillingAccountOption[]> => new Promise(resolve => {
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId)
        }

        timeoutId = window.setTimeout(async () => {
            resolve(await loader(value))
        }, AUTOCOMPLETE_DEBOUNCE_TIME_MS)
    })
}

/**
 * Async billing-account selector backed by server-side name search.
 *
 * The field stores only the selected billing-account id in form state.
 */
export const FormBillingAccountAutocomplete: FC<FormBillingAccountAutocompleteProps> = (
    props: FormBillingAccountAutocompleteProps,
) => {
    const formContext = useFormContext()
    const {
        field,
        fieldState,
    }: UseControllerReturn = useController({
        control: formContext.control,
        name: props.name,
    })

    const [optionCache, setOptionCache] = useState<BillingAccountOption[]>([])
    const [searchErrorMessage, setSearchErrorMessage] = useState<string | undefined>(undefined)

    const menuPortalTarget = useMemo(
        () => (typeof document === 'undefined' ? undefined : document.body),
        [],
    )

    const loadBillingAccountOptions = useCallback(
        async (inputValue: string): Promise<BillingAccountOption[]> => {
            const normalizedInputValue = inputValue.trim()

            setSearchErrorMessage(undefined)

            if (normalizedInputValue.length < AUTOCOMPLETE_MIN_LENGTH) {
                return []
            }

            try {
                const billingAccounts = await searchBillingAccounts({
                    name: normalizedInputValue,
                    page: 1,
                    perPage: 20,
                })
                const options = billingAccounts.map(account => toOption(account))

                setOptionCache(previousOptions => mergeOptions(previousOptions, options))

                return options
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Failed to search billing accounts.'

                setSearchErrorMessage(errorMessage)

                return []
            }
        },
        [],
    )

    const debouncedLoadBillingAccountOptions = useMemo(
        () => createDebouncedLoader(loadBillingAccountOptions),
        [loadBillingAccountOptions],
    )

    const selectedBillingAccountId = useMemo(
        () => normalizeBillingAccountId(field.value),
        [field.value],
    )

    const hasSelectedOption = useMemo(
        () => !!selectedBillingAccountId
            && optionCache.some(option => option.value === selectedBillingAccountId),
        [optionCache, selectedBillingAccountId],
    )

    useEffect(() => {
        if (!selectedBillingAccountId || hasSelectedOption) {
            return undefined
        }

        let isMounted = true

        fetchBillingAccountById(selectedBillingAccountId)
            .then(billingAccount => {
                if (!isMounted) {
                    return
                }

                setOptionCache(previousOptions => mergeOptions(previousOptions, [
                    toOption(billingAccount),
                ]))
            })
            .catch(() => {
                if (!isMounted) {
                    return
                }

                setOptionCache(previousOptions => mergeOptions(previousOptions, [
                    createFallbackOption(selectedBillingAccountId),
                ]))
            })

        return () => {
            isMounted = false
        }
    }, [hasSelectedOption, selectedBillingAccountId])

    const selectedValue = useMemo<BillingAccountOption | undefined>(() => {
        if (!selectedBillingAccountId) {
            return undefined
        }

        return optionCache.find(option => option.value === selectedBillingAccountId)
            || createFallbackOption(selectedBillingAccountId)
    }, [optionCache, selectedBillingAccountId])

    const hint = searchErrorMessage || props.hint

    const handleSelectionChange = useCallback(
        (nextOption: unknown): void => {
            const typedNextOption = nextOption as BillingAccountOption | undefined

            field.onChange(typedNextOption?.value || '')
        },
        [field],
    )

    const noOptionsMessage = useCallback(
        ({
            inputValue,
        }: {
            inputValue: string
        }): string => {
            if (inputValue.trim().length < AUTOCOMPLETE_MIN_LENGTH) {
                return `Type at least ${AUTOCOMPLETE_MIN_LENGTH} characters to search`
            }

            return 'No billing accounts found'
        },
        [],
    )

    return (
        <FormFieldWrapper
            error={fieldState.error?.message}
            hint={hint}
            label={props.label}
            name={props.name}
            required={props.required}
        >
            <AsyncSelect
                cacheOptions
                className={styles.select}
                classNamePrefix='challenge-select'
                defaultOptions={false}
                id={props.name}
                isClearable
                isDisabled={props.disabled}
                loadOptions={debouncedLoadBillingAccountOptions}
                menuPortalTarget={menuPortalTarget}
                noOptionsMessage={noOptionsMessage}
                onBlur={field.onBlur}
                onChange={handleSelectionChange}
                placeholder={props.placeholder || 'Search billing account by name'}
                value={selectedValue}
            />
        </FormFieldWrapper>
    )
}

export default FormBillingAccountAutocomplete
