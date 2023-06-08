import { Dispatch, FC, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'
import { bind, isEmpty, reject, trim } from 'lodash'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { updateMemberTraitsAsync, UserProfile, UserTrait } from '~/libs/core'
import { Button, Collapsible, ConfirmModal, IconOutline, InputSelect, InputText } from '~/libs/ui'
import {
    FinancialInstitutionIcon,
    InternetServiceProviderIcon,
    MobileCarierServiceProviderIcon,
    OtherServiceProviderIcon,
    SettingSection,
    TelevisionServiceProviderIcon,
} from '~/apps/accounts/src/lib'

import { serviceProviderTypes } from './service-provider-types.config'
import styles from './ServiceProvider.module.scss'

interface ServiceProviderProps {
    serviceProviderTrait: UserTrait | undefined
    profile: UserProfile
}

const ServiceProvider: FC<ServiceProviderProps> = (props: ServiceProviderProps) => {
    const formElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const [serviceProviderTypesData, setServiceProviderTypesData]: [
        UserTrait[] | undefined,
        Dispatch<SetStateAction<UserTrait[] | undefined>>
    ] = useState<UserTrait[] | undefined>()

    const [selectedServiceProviderType, setSelectedServiceProviderType]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ]
        = useState<string | undefined>()

    const [selectedServiceProviderName, setSelectedServiceProviderName]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ]
        = useState<string | undefined>()

    const [formErrors, setFormErrors]: [
        { [key: string]: string },
        Dispatch<SetStateAction<{ [key: string]: string }>>
    ]
        = useState<{ [key: string]: string }>({})

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const [removeConfirmationOpen, setRemoveConfirmationOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [itemToUpdate, setItemToUpdate]: [UserTrait | undefined, Dispatch<SetStateAction<UserTrait | undefined>>]
        = useState<UserTrait | undefined>()

    const [itemToRemove, setItemToRemove]: [UserTrait | undefined, Dispatch<SetStateAction<UserTrait | undefined>>]
        = useState<UserTrait | undefined>()

    useEffect(() => {
        setServiceProviderTypesData(props.serviceProviderTrait?.traits.data)
    }, [props.serviceProviderTrait])

    function toggleRemoveConfirmation(): void {
        setRemoveConfirmationOpen(!removeConfirmationOpen)
        setItemToRemove(undefined)
    }

    function handleEditBtnClick(trait: UserTrait): void {
        setItemToUpdate(trait)
        setIsEditMode(true)
        setSelectedServiceProviderType(trait.serviceProviderType)
        setSelectedServiceProviderName(trim(trait.name))
        setFormErrors({})
    }

    function handleTrashBtnClick(trait: UserTrait): void {
        setRemoveConfirmationOpen(true)
        setItemToRemove(trait)
    }

    function handleServiceProviderTypeChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedServiceProviderType(event.target.value)
    }

    function handleServiceProviderNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedServiceProviderName(event.target.value)
    }

    function resetForm(): void {
        setSelectedServiceProviderType(undefined)
        setSelectedServiceProviderName(undefined)
        formElRef.current.reset()
    }

    function handleFormAction(): void {
        // validate the form
        const sN: string = trim(selectedServiceProviderName)
        const updatedFormErrors: { [key: string]: string } = {}
        const serviceProviderTypeUpdate: UserTrait = {
            name: sN,
            serviceProviderType: selectedServiceProviderType,
        }

        if (serviceProviderTypesData?.find(
            (trait: UserTrait) => trait.name === sN && trait.serviceProviderType === selectedServiceProviderType,
        )) {
            resetForm()
            return
        }

        if (!selectedServiceProviderType) {
            updatedFormErrors.serviceProviderType = 'Service Provider type is required'
        }

        if (!sN) {
            updatedFormErrors.serviceProviderName = 'Service Provider name is required'
        }

        if (isEmpty(updatedFormErrors)) {
            // call the API to update the trait based on action type
            if (isEditMode) {
                const updatedServiceProviderTypesData: UserTrait[] = reject(
                    serviceProviderTypesData,
                    (trait: UserTrait) => (
                        trait.name === itemToUpdate?.name
                        && trait.serviceProviderType === itemToUpdate?.serviceProviderType
                    ),
                ) || []

                updateMemberTraitsAsync(
                    props.profile.handle,
                    [{
                        categoryName: 'Service Provider',
                        traitId: 'service_provider',
                        traits: {
                            data: [
                                ...updatedServiceProviderTypesData || [],
                                serviceProviderTypeUpdate,
                            ],
                        },
                    }],
                )
                    .then(() => {
                        toast.success('Service Provider updated successfully')
                        setServiceProviderTypesData([
                            ...updatedServiceProviderTypesData || [],
                            serviceProviderTypeUpdate,
                        ])
                    })
                    .catch(() => {
                        toast.error('Error updating Service Provider')
                    })
                    .finally(() => {
                        resetForm()
                        setIsEditMode(false)
                    })
            } else {
                updateMemberTraitsAsync(
                    props.profile.handle,
                    [{
                        categoryName: 'Service Provider',
                        traitId: 'service_provider',
                        traits: {
                            data: [
                                ...serviceProviderTypesData || [],
                                serviceProviderTypeUpdate,
                            ],
                        },
                    }],
                )
                    .then(() => {
                        toast.success('Service Provider added successfully')
                        setServiceProviderTypesData([
                            ...serviceProviderTypesData || [],
                            serviceProviderTypeUpdate,
                        ])
                    })
                    .catch(() => {
                        toast.error('Error adding new Service Provider')
                    })
                    .finally(() => {
                        resetForm()
                    })
            }
        }

        setFormErrors(updatedFormErrors)
    }

    function handleCancelEditMode(): void {
        setIsEditMode(false)
        resetForm()
        setFormErrors({})
    }

    function onRemoveItemConfirm(): void {
        const updatedServiceProviderTypesData: UserTrait[] = reject(serviceProviderTypesData, (trait: UserTrait) => (
            trait.name === itemToRemove?.name && trait.serviceProviderType === itemToRemove?.serviceProviderType
        )) || []

        updateMemberTraitsAsync(
            props.profile.handle,
            [{
                categoryName: 'Service Provider',
                traitId: 'service_provider',
                traits: {
                    data: updatedServiceProviderTypesData,
                },
            }],
        )
            .then(() => {
                toast.success('Service Provider deleted successfully')
                setServiceProviderTypesData(updatedServiceProviderTypesData)
            })
            .catch(() => {
                toast.error('Error deleting Service Provider')
            })
            .finally(() => {
                toggleRemoveConfirmation()
            })
    }

    function renderServiceProviderIcon(trait: UserTrait): React.ReactNode {
        switch (trait.serviceProviderType) {
            case 'Financial Institution': return <FinancialInstitutionIcon />
            case 'Internet Service Provider': return <InternetServiceProviderIcon />
            case 'MobileCarierServiceProviderIcon': return <MobileCarierServiceProviderIcon />
            case 'Television': return <TelevisionServiceProviderIcon />
            default: return <OtherServiceProviderIcon />
        }
    }

    return (
        <Collapsible
            header={<h3>Service Provider</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            {
                serviceProviderTypesData?.map((trait: UserTrait) => (
                    <SettingSection
                        key={trait.name}
                        leftElement={(
                            <div className={styles.imageWrap}>
                                {renderServiceProviderIcon(trait)}
                            </div>
                        )}
                        title={trait.name}
                        infoText={trait.serviceProviderType}
                        actionElement={(
                            <div className={styles.actionElements}>
                                <Button
                                    className={styles.ctaBtn}
                                    icon={IconOutline.PencilIcon}
                                    onClick={bind(handleEditBtnClick, this, trait)}
                                    size='lg'
                                />
                                <Button
                                    className={styles.ctaBtn}
                                    icon={IconOutline.TrashIcon}
                                    onClick={bind(handleTrashBtnClick, this, trait)}
                                    size='lg'
                                />
                            </div>
                        )}
                    />
                ))
            }

            <ConfirmModal
                title='Delete Confirmation'
                action='delete'
                onClose={toggleRemoveConfirmation}
                onConfirm={onRemoveItemConfirm}
                open={removeConfirmationOpen}
            >
                <div>
                    Are you sure you want to delete
                    {' '}
                    <span className='body-main-bold'>{itemToRemove?.name}</span>
                    ?
                    {' '}
                    This action cannot be undone.
                </div>
            </ConfirmModal>

            <form
                ref={formElRef}
                className={classNames(styles.formWrap, !serviceProviderTypesData?.length ? styles.formNoTop : '')}
            >
                <p>Add a new service provider</p>
                <div className={styles.form}>
                    <InputSelect
                        options={serviceProviderTypes}
                        value={selectedServiceProviderType}
                        onChange={handleServiceProviderTypeChange}
                        name='serviceProviderTypes'
                        label='Service Provider Type *'
                        error={formErrors.serviceProviderType}
                        dirty
                    />
                    <InputText
                        name='serviceProviderName'
                        label='Service Provider Name *'
                        value={selectedServiceProviderName}
                        onChange={handleServiceProviderNameChange}
                        placeholder='Type here the Service Provider Name'
                        tabIndex={0}
                        type='text'
                        error={formErrors.serviceProviderName}
                        dirty
                    />
                    <div className={styles.formCTAs}>
                        {!isEditMode && <IconOutline.PlusCircleIcon />}
                        <Button
                            link
                            label={`${isEditMode ? 'Edit' : 'Add'} Service Provider to your List`}
                            onClick={handleFormAction}
                        />
                        {isEditMode && (
                            <Button
                                className={styles.ctaBtnCancel}
                                link
                                label='Cancel'
                                onClick={handleCancelEditMode}
                            />
                        )}
                    </div>
                </div>
            </form>
        </Collapsible>
    )
}

export default ServiceProvider
