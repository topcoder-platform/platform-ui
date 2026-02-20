import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
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
import { User } from '../../../models'
import {
    fetchProfile,
    searchProfilesByUserIds,
    suggestProfiles,
} from '../../../services'
import { FormFieldWrapper } from '../FormFieldWrapper'

import styles from './FormUserAutocomplete.module.scss'

export type FormUserAutocompleteValueField = 'handle' | 'userId'

interface FormUserAutocompleteProps {
    disabled?: boolean
    label: string
    name: string
    onValueChange?: (value: string) => void
    placeholder?: string
    required?: boolean
    users?: User[]
    valueField?: FormUserAutocompleteValueField
}

interface UserAutocompleteOption {
    label: string
    user: User
    value: string
}

function toOption(
    user: User,
    valueField: FormUserAutocompleteValueField,
): UserAutocompleteOption {
    return {
        label: user.handle,
        user,
        value: user[valueField],
    }
}

function deduplicateUsers(users: User[]): User[] {
    const seenUserIds = new Set<string>()

    return users.filter(user => {
        if (seenUserIds.has(user.userId)) {
            return false
        }

        seenUserIds.add(user.userId)
        return true
    })
}

function createDebouncedLoader(
    loader: (value: string) => Promise<UserAutocompleteOption[]>,
): (value: string) => Promise<UserAutocompleteOption[]> {
    let timeoutId: number | undefined

    return (value: string): Promise<UserAutocompleteOption[]> => new Promise(resolve => {
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId)
        }

        timeoutId = window.setTimeout(async () => {
            resolve(await loader(value))
        }, AUTOCOMPLETE_DEBOUNCE_TIME_MS)
    })
}

export const FormUserAutocomplete: FC<FormUserAutocompleteProps> = (props: FormUserAutocompleteProps) => {
    const formContext = useFormContext()
    const controller: UseControllerReturn = useController({
        control: formContext.control,
        name: props.name,
    })
    const field = controller.field
    const fieldState = controller.fieldState
    const valueField: FormUserAutocompleteValueField = props.valueField || 'handle'
    const onValueChange = props.onValueChange
    const scopedUsers = useMemo(
        () => (Array.isArray(props.users)
            ? deduplicateUsers(props.users)
            : undefined),
        [props.users],
    )
    const [selectedOption, setSelectedOption] = useState<UserAutocompleteOption | undefined>(undefined)
    const lastResolvedValueRef = useRef<string>('')

    const menuPortalTarget = useMemo(
        () => (typeof document === 'undefined' ? undefined : document.body),
        [],
    )

    const loadUserOptions = useCallback(
        async (inputValue: string): Promise<UserAutocompleteOption[]> => {
            const normalizedInputValue = inputValue.trim()

            if (normalizedInputValue.length < AUTOCOMPLETE_MIN_LENGTH) {
                return []
            }

            if (scopedUsers) {
                const normalizedQuery = normalizedInputValue.toLowerCase()

                return scopedUsers
                    .filter(user => user.handle
                        .toLowerCase()
                        .includes(normalizedQuery))
                    .map(user => toOption(user, valueField))
            }

            const [
                suggestedUsers,
                exactMatchUser,
            ] = await Promise.all([
                suggestProfiles(normalizedInputValue),
                fetchProfile(normalizedInputValue)
                    .catch(() => undefined),
            ])

            const users = deduplicateUsers([
                ...suggestedUsers,
                ...(exactMatchUser ? [exactMatchUser] : []),
            ])

            return users.map(user => toOption(user, valueField))
        },
        [
            scopedUsers,
            valueField,
        ],
    )

    const debouncedLoadUserOptions = useMemo(
        () => createDebouncedLoader(loadUserOptions),
        [loadUserOptions],
    )

    useEffect(() => {
        const normalizedValue = typeof field.value === 'string'
            ? field.value.trim()
            : ''
        let mounted = true

        if (!normalizedValue) {
            setSelectedOption(undefined)
            lastResolvedValueRef.current = ''
        } else if (valueField !== 'userId') {
            lastResolvedValueRef.current = ''
        } else {
            const hasResolvedLabel = selectedOption?.value === normalizedValue
                && !!selectedOption.label.trim()
                && selectedOption.label !== normalizedValue

            if (!hasResolvedLabel && lastResolvedValueRef.current !== normalizedValue) {
                lastResolvedValueRef.current = normalizedValue

                searchProfilesByUserIds([normalizedValue])
                    .then(users => {
                        if (!mounted) {
                            return
                        }

                        const matchedUser = users.find(user => user.userId === normalizedValue)
                        if (!matchedUser) {
                            return
                        }

                        setSelectedOption(toOption(matchedUser, valueField))
                    })
                    .catch(() => undefined)
            }
        }

        return () => {
            mounted = false
        }
    }, [
        field.value,
        selectedOption?.label,
        selectedOption?.value,
        valueField,
    ])

    const value = useMemo<UserAutocompleteOption | undefined>(() => {
        if (typeof field.value === 'object' && field.value && 'value' in field.value) {
            return field.value as UserAutocompleteOption
        }

        if (typeof field.value === 'string' && field.value.trim()) {
            if (selectedOption?.value === field.value) {
                return selectedOption
            }

            return {
                label: field.value,
                user: {
                    handle: field.value,
                    userId: field.value,
                },
                value: field.value,
            }
        }

        return undefined
    }, [field.value, selectedOption])

    const handleSelectionChange = useCallback(
        (nextOption: unknown): void => {
            const nextSelectedOption = nextOption as UserAutocompleteOption | undefined
            const nextValue = nextSelectedOption
                ? nextSelectedOption.value
                : ''

            setSelectedOption(nextSelectedOption)
            field.onChange(nextValue)
            onValueChange?.(nextValue)
        },
        [field, onValueChange],
    )

    return (
        <FormFieldWrapper
            error={fieldState.error?.message}
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
                loadOptions={debouncedLoadUserOptions}
                menuPortalTarget={menuPortalTarget}
                onBlur={field.onBlur}
                onChange={handleSelectionChange}
                placeholder={props.placeholder || 'Search user handles'}
                value={value}
            />
        </FormFieldWrapper>
    )
}

export default FormUserAutocomplete
