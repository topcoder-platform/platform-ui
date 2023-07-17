import { Dispatch, FC, SetStateAction, useState } from 'react'
import { bind, trim } from 'lodash'
import { toast } from 'react-toastify'

import { BaseModal, Button, InputSelect, InputText } from '~/libs/ui'
import {
    CountryLookup,
    updateMemberProfileAsync,
    useCountryLookup,
    UserProfile,
} from '~/libs/core'

import styles from './ModifyLocationModal.module.scss'

interface ModifyLocationModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
}

const ModifyLocationModal: FC<ModifyLocationModalProps> = (props: ModifyLocationModalProps) => {
    const countryLookup: CountryLookup[] | undefined
        = useCountryLookup()

    const [formValues, setFormValues]: [any, Dispatch<any>] = useState({
        country: props.profile.homeCountryCode || props.profile.competitionCountryCode,
        ...props.profile.addresses ? props.profile.addresses[0] : {},
    })

    const [formSaveError, setFormSaveError]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ] = useState<string | undefined>()

    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isFormChanged, setIsFormChanged]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleFormValueChange(key: string, event: React.ChangeEvent<HTMLInputElement>): void {
        const oldFormValues = { ...formValues }

        setFormValues({
            ...oldFormValues,
            [key]: event.target.value,
        })
        setIsFormChanged(true)
    }

    function handleLocationSave(): void {
        updateMemberProfileAsync(
            props.profile.handle,
            {
                addresses: [{
                    ...props.profile.addresses ? props.profile.addresses[0] : {},
                    city: trim(formValues.city),
                }],
                competitionCountryCode: formValues.country,
                homeCountryCode: formValues.country,
            },
        )
            .then(() => {
                toast.success('Your location has been updated.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch((error: any) => {
                toast.error('Something went wrong. Please try again.', { position: toast.POSITION.BOTTOM_RIGHT })
                setFormSaveError(error.message || error)
            })
            .finally(() => {
                setIsFormChanged(false)
                setIsSaving(false)
            })
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='Location'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleLocationSave}
                        primary
                        disabled={isSaving || !isFormChanged}
                    />
                </div>
            )}
        >
            <p>Provide details on your location.</p>
            <form className={styles.editForm}>
                <InputText
                    label='City'
                    name='city'
                    onChange={bind(handleFormValueChange, this, 'city')}
                    value={formValues.city}
                    tabIndex={0}
                    type='text'
                    placeholder='Select your city name'
                />
                <InputSelect
                    options={(countryLookup || []).map((cl: CountryLookup) => ({
                        label: cl.country,
                        value: cl.countryCode,
                    }))}
                    value={formValues.country}
                    onChange={bind(handleFormValueChange, this, 'country')}
                    name='country'
                    label='Country *'
                    placeholder='Select a Country'
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

export default ModifyLocationModal
