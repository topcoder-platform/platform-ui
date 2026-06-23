import { ChangeEvent, Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import {
    updateOrCreateMemberTraitsAsync,
    UserProfile,
    UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'
import { BaseModal, Button, InputMultiselect, InputMultiselectOption } from '~/libs/ui'
import { preferredRoleOptions } from '~/libs/shared/lib/components/modify-open-to-work-modal'

import {
    getOpenToWorkWithoutPreferredRoles,
    getPreferredRolesValues,
} from '../../../../lib'

import styles from './ModifyPreferredRolesModal.module.scss'

interface ModifyPreferredRolesModalProps {
    memberPersonalizationTraitsData: UserTrait[] | undefined
    onClose: () => void
    onSave: () => void
    profile: UserProfile
}

/**
 * Renders the modal used to edit the independent preferred roles profile field.
 *
 * @param {ModifyPreferredRolesModalProps} props - Profile, personalization data, and modal callbacks.
 * @returns {JSX.Element} A modal with a preferred roles autocomplete multiselect and save/cancel actions.
 */
const ModifyPreferredRolesModal: FC<ModifyPreferredRolesModalProps> = (props: ModifyPreferredRolesModalProps) => {
    const [preferredRoles, setPreferredRoles]: [
        string[],
        Dispatch<SetStateAction<string[]>>
    ] = useState<string[]>(getPreferredRolesValues(props.memberPersonalizationTraitsData))

    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isFormChanged, setIsFormChanged]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [formSaveError, setFormSaveError]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ] = useState<string | undefined>()

    useEffect(() => {
        setPreferredRoles(getPreferredRolesValues(props.memberPersonalizationTraitsData))
        setIsFormChanged(false)
    }, [props.memberPersonalizationTraitsData])

    function handlePreferredRolesChange(event: ChangeEvent<HTMLInputElement>): void {
        const options = (event.target as unknown as { value: InputMultiselectOption[] }).value

        setPreferredRoles(options.map(option => option.value))
        setIsFormChanged(true)
    }

    async function fetchPreferredRoles(query: string): Promise<InputMultiselectOption[]> {
        if (!query) {
            return preferredRoleOptions
        }

        const normalizedQuery = query.toLowerCase()
        return preferredRoleOptions.filter(option => {
            const normalizedLabel = option.label?.toString()
                .toLowerCase()

            return normalizedLabel?.includes(normalizedQuery)
        })
    }

    function handlePreferredRolesSave(): void {
        const existing = props.memberPersonalizationTraitsData?.[0] || {}
        const personalizationItem: UserTrait = {
            ...existing,
            preferredRoles,
        }

        if (existing.openToWork) {
            personalizationItem.openToWork = getOpenToWorkWithoutPreferredRoles(existing.openToWork)
        }

        setIsSaving(true)
        setFormSaveError(undefined)

        updateOrCreateMemberTraitsAsync(props.profile.handle, [{
            categoryName: UserTraitCategoryNames.personalization,
            traitId: UserTraitIds.personalization,
            traits: {
                data: [personalizationItem],
            },
        }])
            .then(() => {
                toast.success('Preferred roles updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch((error: any) => {
                toast.error('Failed to update your preferred roles.', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
                setFormSaveError(error.message || error)
            })
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='Enter your preferred roles'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handlePreferredRolesSave}
                        primary
                        disabled={isSaving || !isFormChanged}
                    />
                </div>
            )}
        >
            <form className={styles.editForm}>
                <InputMultiselect
                    additionalPlaceholder='Add more...'
                    label='Preferred Roles'
                    name='preferredRoles'
                    onFetchOptions={fetchPreferredRoles}
                    options={preferredRoleOptions}
                    onChange={handlePreferredRolesChange}
                    placeholder='Select preferred roles'
                    tabIndex={0}
                    value={preferredRoleOptions.filter(
                        option => preferredRoles.includes(option.value),
                    )}
                />
            </form>

            {
                formSaveError && (
                    <div className={styles.formError}>
                        {formSaveError}
                    </div>
                )
            }
        </BaseModal>
    )
}

export default ModifyPreferredRolesModal
