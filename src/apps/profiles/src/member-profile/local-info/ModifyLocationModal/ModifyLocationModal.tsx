import { omit, trim } from 'lodash'
import { toast } from 'react-toastify'
import React, { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react'

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

const OMIT_ADDRESS_KEYS_ON_UPDATE = [
    'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
]

const ModifyLocationModal: FC<ModifyLocationModalProps> = (props: ModifyLocationModalProps) => {
    const countryLookup: CountryLookup[] | undefined
        = useCountryLookup()

    const countries = useMemo(
        () => (countryLookup || []).map((cl: CountryLookup) => ({
            label: cl.country,
            value: cl.countryCode,
        }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        [countryLookup],
    )

    const existingAddress = props.profile.addresses ? props.profile.addresses[0] : {}

    const [formValues, setFormValues]: [any, Dispatch<any>] = useState({
        country: props.profile.homeCountryCode,
        ...existingAddress,
    })

    const [formErrors, setFormErrors]: [
    { [key: string]: string },
    Dispatch<SetStateAction<{ [key: string]: string }>>
  ] = useState({})

    const [formSaveError, setFormSaveError] = useState<string | undefined>()
    const [isSaving, setIsSaving] = useState(false)
    const [isFormChanged, setIsFormChanged] = useState(false)

    const handleFormValueChange = useCallback(
        (key: string) => (event: any): void => {
            const value = event?.target?.value ?? event?.value ?? event

            setFormValues((prev: any) => ({
                ...prev,
                [key]: value,
            }))

            setIsFormChanged(true)

            setFormErrors(prev => {
                if (!prev[key]) return prev
                const next = { ...prev }
                delete next[key]
                return next
            })
        },
        [],
    )

    function validate(): boolean {
        const nextErrors: { [key: string]: string } = {}

        if (!trim(formValues.city)) nextErrors.city = 'Please select a city'
        if (!formValues.country) nextErrors.country = 'Please select a country'

        setFormErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    function handleLocationSave(): void {
        if (!validate()) return

        setIsSaving(true)

        const baseAddressPayload = props.profile.addresses
            ? omit(props.profile.addresses[0], OMIT_ADDRESS_KEYS_ON_UPDATE)
            : {}

        updateMemberProfileAsync(props.profile.handle, {
            addresses: [
                {
                    ...baseAddressPayload,
                    city: trim(formValues.city),
                    stateCode: trim(formValues.stateCode),
                    streetAddr1: trim(formValues.streetAddr1),
                    streetAddr2: trim(formValues.streetAddr2),
                    zip: trim(formValues.zip),
                },
            ],
            competitionCountryCode: formValues.country,
            homeCountryCode: formValues.country,
        })
            .then(() => {
                toast.success('Your location has been updated.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch((error: any) => {
                toast.error('Something went wrong. Please try again.', { position: toast.POSITION.BOTTOM_RIGHT })
                setFormSaveError(error?.message || error)
            })
            .finally(() => {
                setIsFormChanged(false)
                setIsSaving(false)
            })
    }

    return (
        <BaseModal
            bodyClassName={styles.localModalBody}
            classNames={{
                modal: styles.localModal,
            }}
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
                    name='address'
                    label='Address'
                    error={formErrors.streetAddr1}
                    placeholder='Your address'
                    dirty
                    tabIndex={0}
                    type='text'
                    onChange={handleFormValueChange('streetAddr1')}
                    value={formValues.streetAddr1}
                />

                <InputText
                    name='address2'
                    label='Address 2'
                    error={formErrors.streetAddr2}
                    placeholder='Your address continued'
                    dirty
                    tabIndex={0}
                    type='text'
                    onChange={handleFormValueChange('streetAddr2')}
                    value={formValues.streetAddr2}
                />

                <InputText
                    name='city'
                    label='City *'
                    error={formErrors.city}
                    placeholder='Which city do you live in?'
                    dirty
                    tabIndex={0}
                    type='text'
                    onChange={handleFormValueChange('city')}
                    value={formValues.city}
                />

                <InputText
                    name='state'
                    label='State'
                    error={formErrors.stateCode}
                    placeholder='State'
                    dirty
                    tabIndex={0}
                    type='text'
                    onChange={handleFormValueChange('stateCode')}
                    value={formValues.stateCode}
                />

                <InputText
                    name='zip'
                    label='Zip/Postal Code'
                    error={formErrors.zip}
                    placeholder='Your Zip or Postal Code'
                    dirty
                    tabIndex={0}
                    type='text'
                    onChange={handleFormValueChange('zip')}
                    value={formValues.zip}
                />

                <InputSelect
                    options={countries}
                    value={formValues.country}
                    onChange={handleFormValueChange('country')}
                    name='country'
                    label='Country *'
                    error={formErrors.country}
                    placeholder='Select a Country'
                    dirty
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
