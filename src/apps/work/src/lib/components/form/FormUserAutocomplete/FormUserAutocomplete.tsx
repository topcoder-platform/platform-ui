import {
    FC,
    useCallback,
    useMemo,
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
    suggestProfiles,
} from '../../../services'
import { FormFieldWrapper } from '../FormFieldWrapper'

import styles from './FormUserAutocomplete.module.scss'

export type FormUserAutocompleteValueField = 'handle' | 'userId'

interface FormUserAutocompleteProps {
    disabled?: boolean
    label: string
    name: string
    placeholder?: string
    required?: boolean
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
        [valueField],
    )

    const debouncedLoadUserOptions = useMemo(
        () => createDebouncedLoader(loadUserOptions),
        [loadUserOptions],
    )

    const value = useMemo<UserAutocompleteOption | undefined>(() => {
        if (typeof field.value === 'object' && field.value && 'value' in field.value) {
            return field.value as UserAutocompleteOption
        }

        if (typeof field.value === 'string' && field.value.trim()) {
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
    }, [field.value])

    const handleSelectionChange = useCallback(
        (selectedOption: unknown): void => {
            const typedSelectedOption = selectedOption as UserAutocompleteOption | undefined

            field.onChange(typedSelectedOption
                ? typedSelectedOption.value
                : '')
        },
        [field],
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
