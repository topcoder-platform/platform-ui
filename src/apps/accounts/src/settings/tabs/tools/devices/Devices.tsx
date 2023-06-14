/* eslint-disable complexity */
import { Dispatch, FC, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'
import { bind, compact, isEmpty, reject, uniqBy } from 'lodash'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import {
    createMemberTraitsAsync,
    updateMemberTraitsAsync,
    useMemberDevicesLookup,
    UserProfile,
    UserTrait,
} from '~/libs/core'
import { Button, Collapsible, ConfirmModal, IconOutline, InputSelect } from '~/libs/ui'
import {
    ConsoleIcon,
    DesktopIncon,
    LaptopIcon,
    OtherDeviceIcon,
    SettingSection,
    SmartphoneIcon,
    TabletIcon,
    WearableIcon,
} from '~/apps/accounts/src/lib'

import styles from './Devices.module.scss'

interface DevicesProps {
    devicesTrait: UserTrait | undefined
    profile: UserProfile
}

const methodsMap: { [key: string]: any } = {
    create: createMemberTraitsAsync,
    update: updateMemberTraitsAsync,
}

const Devices: FC<DevicesProps> = (props: DevicesProps) => {
    const formElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const deviceTypes: any = useMemberDevicesLookup('/types')

    const [deviceTypesData, setDeviceTypesData]: [
        UserTrait[] | undefined,
        Dispatch<SetStateAction<UserTrait[] | undefined>>
    ] = useState<UserTrait[] | undefined>()

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

    const [selectedDeviceType, setSelectedDeviceType]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ]
        = useState<string | undefined>()

    const deviceTypeManufacturers: any
        = useMemberDevicesLookup(selectedDeviceType ? `/manufacturers?type=${selectedDeviceType}` : undefined)

    const [selectedDeviceManufacturerType, setSelectedDeviceManufacturerType]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ]
        = useState<string | undefined>()

    const deviceTypeManufacturerModels: any
        = useMemberDevicesLookup(
            selectedDeviceType && selectedDeviceManufacturerType
                ? `?type=${selectedDeviceType}&manufacturer=${selectedDeviceManufacturerType}&page=1&perPage=100`
                : undefined,
        )

    const [selectedDeviceManufacturerModelType, setSelectedDeviceManufacturerModelType]: [
        any,
        Dispatch<SetStateAction<any | undefined>>
    ]
        = useState<any | undefined>()

    const deviceTypeManufacturerModelOS: any
        = useMemberDevicesLookup(
            selectedDeviceType && selectedDeviceManufacturerType && selectedDeviceManufacturerModelType?.model
                // eslint-disable-next-line max-len
                ? `?type=${selectedDeviceType}&manufacturer=${selectedDeviceManufacturerType}&model=${selectedDeviceManufacturerModelType.model}&page=1&perPage=100`
                : undefined,
        )

    const [selectedDeviceManufacturerModelOSType, setSelectedDeviceManufacturerModelOSType]: [
        any,
        Dispatch<SetStateAction<any | undefined>>
    ]
        = useState<any | undefined>()

    useEffect(() => {
        setDeviceTypesData(props.devicesTrait?.traits.data)
    }, [props.devicesTrait])

    function toggleRemoveConfirmation(): void {
        setRemoveConfirmationOpen(!removeConfirmationOpen)
        setItemToRemove(undefined)
    }

    function handleEditBtnClick(trait: UserTrait): void {
        setItemToUpdate(trait)
        setIsEditMode(true)
        setSelectedDeviceType(trait.deviceType)
        setSelectedDeviceManufacturerType(trait.manufacturer)
        setSelectedDeviceManufacturerModelType({
            model: trait.model,
        })
        setSelectedDeviceManufacturerModelOSType({
            operatingSystem: trait.operatingSystem,
        })
        setFormErrors({})
    }

    function handleTrashBtnClick(trait: UserTrait): void {
        setRemoveConfirmationOpen(true)
        setItemToRemove(trait)
    }

    function renderDeviceImage(trait: UserTrait): JSX.Element {
        switch (trait.deviceType) {
            case 'Console': return <ConsoleIcon />
            case 'Desktop': return <DesktopIncon />
            case 'Laptop': return <LaptopIcon />
            case 'Smartphone': return <SmartphoneIcon />
            case 'Tablet': return <TabletIcon />
            case 'Wearable': return <WearableIcon />
            default: return <OtherDeviceIcon />
        }
    }

    function resetForm(): void {
        setSelectedDeviceType(undefined)
        setSelectedDeviceManufacturerType(undefined)
        setSelectedDeviceManufacturerModelType(undefined)
        setSelectedDeviceManufacturerModelOSType(undefined)
        formElRef.current.reset()
        setIsEditMode(false)
        setFormErrors({})
    }

    function onRemoveItemConfirm(): void {
        const updatedDeviceTypesData: UserTrait[] = reject(deviceTypesData, (trait: UserTrait) => (
            trait.model === itemToRemove?.model
            && trait.deviceType === itemToRemove?.deviceType
            && trait.operatingSystem === itemToRemove?.operatingSystem
        )) || []

        resetForm()

        updateMemberTraitsAsync(
            props.profile.handle,
            [{
                categoryName: 'Device',
                traitId: 'device',
                traits: {
                    data: updatedDeviceTypesData,
                },
            }],
        )
            .then(() => {
                toast.success('Device deleted successfully')
                setDeviceTypesData(updatedDeviceTypesData)
            })
            .catch(() => {
                toast.error('Error deleting Device')
            })
            .finally(() => {
                toggleRemoveConfirmation()
            })
    }

    function handleSelectedDeviceTypeChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedDeviceType(event.target.value)
    }

    function handleCancelEditMode(): void {
        setIsEditMode(false)
        resetForm()
        setFormErrors({})
    }

    function handleSelectedDeviceManufacturerTypeChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedDeviceManufacturerType(event.target.value)
    }

    function handleSelectedDeviceManufacturerModelTypeChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedDeviceManufacturerModelType({
            model: event.target.value,
        })
    }

    function handleSelectedDeviceManufacturerModelOSTypeChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedDeviceManufacturerModelOSType({
            operatingSystem: event.target.value,
        })
    }

    function handleFormAction(): void {
        const updatedFormErrors: { [key: string]: string } = {}
        const deviceUpdate: UserTrait = {
            deviceType: selectedDeviceType,
            manufacturer: selectedDeviceManufacturerType,
            model: selectedDeviceManufacturerModelType?.model,
            operatingSystem: selectedDeviceManufacturerModelOSType?.operatingSystem,
        }

        if (deviceTypesData?.find(
            (trait: UserTrait) =>
                // eslint-disable-next-line implicit-arrow-linebreak
                trait.manufacturer === selectedDeviceManufacturerType
                && trait.deviceType === selectedDeviceType
                && trait.model === selectedDeviceManufacturerModelType?.model
                && trait.operatingSystem === selectedDeviceManufacturerModelOSType?.operatingSystem,
        )) {
            toast.success('Look like you\'ve already entered this device.')
            resetForm()
            return
        }

        if (!selectedDeviceType) {
            updatedFormErrors.deviceType = 'Device type is required'
        }

        if (!selectedDeviceManufacturerType) {
            updatedFormErrors.deviceManufacturerType = 'Device Manufacturer is required'
        }

        if (!selectedDeviceManufacturerModelType?.model) {
            updatedFormErrors.deviceManufacturerModelType = 'Device Model type is required'
        }

        if (!selectedDeviceManufacturerModelOSType?.operatingSystem) {
            updatedFormErrors.deviceManufacturerModelOSType = 'Device Operating System is required'
        }

        if (isEmpty(updatedFormErrors)) {
            // call the API to update the trait based on action type
            if (isEditMode) {
                const updatedDeviceTypesData: UserTrait[] = reject(
                    deviceTypesData,
                    (trait: UserTrait) => (
                        trait.deviceType === itemToUpdate?.deviceType
                        && trait.manufacturer === itemToUpdate?.manufacturer
                        && trait.model === itemToUpdate?.model
                        && trait.operatingSystem === itemToUpdate?.operatingSystem
                    ),
                ) || []

                updateMemberTraitsAsync(
                    props.profile.handle,
                    [{
                        categoryName: 'Device',
                        traitId: 'device',
                        traits: {
                            data: [
                                ...updatedDeviceTypesData || [],
                                deviceUpdate,
                            ],
                        },
                    }],
                )
                    .then(() => {
                        toast.success('Device updated successfully')
                        setDeviceTypesData([
                            ...updatedDeviceTypesData || [],
                            deviceUpdate,
                        ])
                    })
                    .catch(() => {
                        toast.error('Error updating Device')
                    })
                    .finally(() => {
                        resetForm()
                        setIsEditMode(false)
                    })
            } else {
                methodsMap[!deviceTypesData || !deviceTypesData.length ? 'create' : 'update'](
                    props.profile.handle,
                    [{
                        categoryName: 'Device',
                        traitId: 'device',
                        traits: {
                            data: [
                                ...deviceTypesData || [],
                                deviceUpdate,
                            ],
                        },
                    }],
                )
                    .then(() => {
                        toast.success('Device added successfully')
                        setDeviceTypesData([
                            ...deviceTypesData || [],
                            deviceUpdate,
                        ])
                    })
                    .catch(() => {
                        toast.error('Error adding new Device')
                    })
                    .finally(() => {
                        resetForm()
                        setIsEditMode(false)
                    })
            }
        }

        setFormErrors(updatedFormErrors)
    }

    return (
        <Collapsible
            header={<h3>YOUR DEVICES</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            {
                deviceTypesData?.map((trait: UserTrait) => (
                    <SettingSection
                        key={`${trait.model}-${trait.manufacturer}-${trait.operatingSystem}-${trait.deviceType}`}
                        leftElement={(
                            <div className={styles.imageWrap}>
                                {renderDeviceImage(trait)}
                            </div>
                        )}
                        title={trait.model}
                        infoText={
                            compact([
                                trait.manufacturer, trait.operatingSystem, trait.deviceType,
                            ])
                                .join(' | ')
                        }
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
                className={classNames(styles.formWrap, !deviceTypesData?.length ? styles.formNoTop : '')}
            >
                <p>Add a new device to your devices list</p>
                <div className={styles.form}>
                    <InputSelect
                        options={deviceTypes?.map((type: string) => ({ label: type, value: type })) || []}
                        value={selectedDeviceType}
                        onChange={handleSelectedDeviceTypeChange}
                        name='memberDeviceTypes'
                        label='Device Type *'
                        error={formErrors.deviceType}
                        dirty
                        placeholder='Select a Device Type'
                    />

                    <InputSelect
                        options={deviceTypeManufacturers?.map((type: string) => ({ label: type, value: type })) || []}
                        value={selectedDeviceManufacturerType}
                        onChange={handleSelectedDeviceManufacturerTypeChange}
                        name='memberDeviceManufacturerTypes'
                        label='Manufacturer *'
                        error={formErrors.deviceManufacturerType}
                        dirty
                        placeholder='Select a Device Manufacturer'
                    />

                    <InputSelect
                        options={
                            (uniqBy(deviceTypeManufacturerModels, 'model') || [])
                                .map(
                                    (type: any) => ({ label: type.model, value: type.model }),
                                ) || []
                        }
                        value={selectedDeviceManufacturerModelType?.model}
                        onChange={handleSelectedDeviceManufacturerModelTypeChange}
                        name='memberDeviceManufacturerModelTypes'
                        label='Model *'
                        error={formErrors.deviceManufacturerModelType}
                        dirty
                        placeholder='Select a Device Manufacturer Model'
                    />

                    <InputSelect
                        options={
                            deviceTypeManufacturerModelOS?.map(
                                (type: any) => ({ label: type.operatingSystem, value: type.operatingSystem }),
                            ) || []
                        }
                        value={selectedDeviceManufacturerModelOSType?.operatingSystem}
                        onChange={handleSelectedDeviceManufacturerModelOSTypeChange}
                        name='memberDeviceManufacturerModelOSTypes'
                        label='Operating System *'
                        error={formErrors.deviceManufacturerModelOSType}
                        dirty
                        placeholder='Select a Device Manufacturer Model Operating System'
                    />

                    <div className={styles.formCTAs}>
                        {!isEditMode && <IconOutline.PlusCircleIcon />}
                        <Button
                            link
                            label={`${isEditMode ? 'Edit' : 'Add'} Device to your List`}
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

export default Devices
