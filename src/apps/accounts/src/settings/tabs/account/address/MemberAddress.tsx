import { Dispatch, FC, SetStateAction, useState } from 'react'
import { toast } from 'react-toastify'
import { bind, trim } from 'lodash'
import classNames from 'classnames'

import {
    Button,
    Collapsible, InputSelect, InputText,
} from '~/libs/ui'
import {
    CountryLookup,
    updateMemberProfileAsync,
    useCountryLookup,
    UserProfile,
} from '~/libs/core'

import styles from './MemberAddress.module.scss'

interface MemberAddressProps {
    profile: UserProfile
}

const MemberAddress: FC<MemberAddressProps> = (props: MemberAddressProps) => {
    const countryLookup: CountryLookup[] | undefined
        = useCountryLookup()

    const [formValues, setFormValues]: [any, Dispatch<any>] = useState({
        country: props.profile.homeCountryCode || props.profile.competitionCountryCode,
        ...props.profile.addresses ? props.profile.addresses[0] : {},
    })

    const [formErrors, setFormErrors]: [
        { [key: string]: string },
        Dispatch<SetStateAction<{ [key: string]: string }>>
    ]
        = useState<{ [key: string]: string }>({})

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

    function handleFormAction(): void {
        if (!trim(formValues.city)) {
            setFormErrors({ city: 'Please select a city' })
            return
        }

        if (!formValues.country) {
            setFormErrors({ country: 'Please select a country' })
            return
        }

        setIsSaving(true)

        updateMemberProfileAsync(
            props.profile.handle,
            {
                addresses: [{
                    city: formValues.city,
                    stateCode: formValues.stateCode,
                    streetAddr1: formValues.streetAddr1,
                    streetAddr2: formValues.streetAddr2,
                    zip: formValues.zip,
                }],
                competitionCountryCode: formValues.country,
                homeCountryCode: formValues.country,
            },
        )
            .then(() => {
                toast.success('Your account has been updated.', { position: toast.POSITION.BOTTOM_RIGHT })
                setFormErrors({})
            })
            .catch(() => {
                toast.error('Something went wrong. Please try again.', { position: toast.POSITION.BOTTOM_RIGHT })
            })
            .finally(() => {
                setIsFormChanged(false)
                setIsSaving(false)
            })
    }

    return (
        <Collapsible
            header={<h3>Address</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            <p>
                By keeping this information up to date we may surprise you with a cool T-shirt.
                Sharing your contact details will never result in robocalls about health insurance plans or junk mail.
            </p>

            <form
                className={classNames(styles.formWrap)}
            >
                <div className={styles.form}>
                    <InputText
                        name='address'
                        label='Address'
                        error={formErrors.streetAddr1}
                        placeholder='Your address'
                        dirty
                        tabIndex={0}
                        type='text'
                        onChange={bind(handleFormValueChange, this, 'streetAddr1')}
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
                        onChange={bind(handleFormValueChange, this, 'streetAddr2')}
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
                        onChange={bind(handleFormValueChange, this, 'city')}
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
                        onChange={bind(handleFormValueChange, this, 'stateCode')}
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
                        onChange={bind(handleFormValueChange, this, 'zip')}
                        value={formValues.zip}
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
                        error={formErrors.country}
                        placeholder='Select a Country'
                        dirty
                    />

                    <div className={styles.formCTAs}>
                        <Button
                            secondary
                            size='lg'
                            label='Save Changes'
                            onClick={handleFormAction}
                            disabled={isSaving || !isFormChanged}
                        />
                    </div>
                </div>
            </form>
        </Collapsible>
    )
}

export default MemberAddress
