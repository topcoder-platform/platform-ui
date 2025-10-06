import { Dispatch, FC, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'
import { bind, isEmpty, reject, trim } from 'lodash'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { createMemberTraitsAsync, updateMemberTraitsAsync, UserProfile, UserTrait, UserTraitIds } from '~/libs/core'
import { Button, Collapsible, ConfirmModal, IconOutline, InputSelect, InputText } from '~/libs/ui'
import { SettingSection, SoftwareIcon, triggerSurvey } from '~/apps/accounts/src/lib'

import { softwareTypes } from './software-types.config'
import styles from './Software.module.scss'

interface SoftwareProps {
    softwareTrait: UserTrait | undefined
    profile: UserProfile
}

const Software: FC<SoftwareProps> = (props: SoftwareProps) => {
    const formElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const [softwareTypesData, setSoftwareTypesData]: [
        UserTrait[] | undefined,
        Dispatch<SetStateAction<UserTrait[] | undefined>>
    ] = useState<UserTrait[] | undefined>()

    const [selectedSoftwareType, setSelectedSoftwareType]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ]
        = useState<string | undefined>()

    const [selectedSoftwareName, setSelectedSoftwareName]: [
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
        setSoftwareTypesData(props.softwareTrait?.traits.data)
    }, [props.softwareTrait])

    function toggleRemoveConfirmation(): void {
        setRemoveConfirmationOpen(!removeConfirmationOpen)
        setItemToRemove(undefined)
    }

    function handleEditBtnClick(trait: UserTrait): void {
        setItemToUpdate(trait)
        setIsEditMode(true)
        setSelectedSoftwareType(trait.softwareType)
        setSelectedSoftwareName(trim(trait.name))
        setFormErrors({})
    }

    function handleTrashBtnClick(trait: UserTrait): void {
        setRemoveConfirmationOpen(true)
        setItemToRemove(trait)
    }

    function handleSoftwareTypeChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedSoftwareType(event.target.value)
    }

    function handleSoftwareNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedSoftwareName(event.target.value)
    }

    function resetForm(): void {
        setSelectedSoftwareType(undefined)
        setSelectedSoftwareName(undefined)
        formElRef.current.reset()
        setIsEditMode(false)
    }

    function handleFormAction(): void {
        // validate the form
        const sN: string = trim(selectedSoftwareName)
        const updatedFormErrors: { [key: string]: string } = {}
        const softwareTypeUpdate: UserTrait = {
            name: sN,
            softwareType: selectedSoftwareType,
        }

        if (softwareTypesData?.find(
            (trait: UserTrait) => trait.name === sN && trait.softwareType === selectedSoftwareType,
        )) {
            resetForm()
            return
        }

        if (!selectedSoftwareType) {
            updatedFormErrors.softwareType = 'Software type is required'
        }

        if (!sN) {
            updatedFormErrors.softwareName = 'Software name is required'
        }

        if (isEmpty(updatedFormErrors)) {
            // call the API to update the trait based on action type
            if (isEditMode) {
                const updatedSoftwareTypesData: UserTrait[] = reject(softwareTypesData, (trait: UserTrait) => (
                    trait.name === itemToUpdate?.name && trait.softwareType === itemToUpdate?.softwareType
                )) || []

                updateMemberTraitsAsync(
                    props.profile.handle,
                    [{
                        categoryName: 'Software',
                        traitId: 'software',
                        traits: {
                            data: [
                                ...updatedSoftwareTypesData || [],
                                softwareTypeUpdate,
                            ],
                            traitId: UserTraitIds.software,
                        },
                    }],
                )
                    .then(() => {
                        toast.success('Software updated successfully')
                        setSoftwareTypesData([
                            ...updatedSoftwareTypesData || [],
                            softwareTypeUpdate,
                        ])
                        triggerSurvey()
                    })
                    .catch(() => {
                        toast.error('Error updating software')
                    })
                    .finally(() => {
                        resetForm()
                        setIsEditMode(false)
                    })
            } else {
                const request = [{
                    categoryName: 'Software',
                    traitId: 'software',
                    traits: {
                        data: [
                            ...softwareTypesData || [],
                            softwareTypeUpdate,
                        ],
                        traitId: UserTraitIds.software,
                    },
                }]

                const action = props.softwareTrait ? updateMemberTraitsAsync : createMemberTraitsAsync

                action(
                    props.profile.handle,
                    request,
                )
                    .then(() => {
                        toast.success('Software added successfully')
                        setSoftwareTypesData([
                            ...softwareTypesData || [],
                            softwareTypeUpdate,
                        ])
                        triggerSurvey()
                    })
                    .catch(() => {
                        toast.error('Error adding new software')
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
        const updatedSoftwareTypesData: UserTrait[] = reject(softwareTypesData, (trait: UserTrait) => (
            trait.name === itemToRemove?.name && trait.softwareType === itemToRemove?.softwareType
        )) || []

        resetForm()

        updateMemberTraitsAsync(
            props.profile.handle,
            [{
                categoryName: 'Software',
                traitId: 'software',
                traits: {
                    data: updatedSoftwareTypesData,
                    traitId: UserTraitIds.software,
                },
            }],
        )
            .then(() => {
                toast.success('Software deleted successfully')
                setSoftwareTypesData(updatedSoftwareTypesData)
                triggerSurvey()
            })
            .catch(() => {
                toast.error('Error deleting software')
            })
            .finally(() => {
                toggleRemoveConfirmation()
            })
    }

    return (
        <Collapsible
            header={<h3>Software</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            {
                softwareTypesData?.map((trait: UserTrait) => (
                    <SettingSection
                        key={trait.name}
                        leftElement={(
                            <div className={styles.imageWrap}>
                                <SoftwareIcon />
                            </div>
                        )}
                        title={trait.name}
                        infoText={softwareTypes.find(t => t.value === trait.softwareType)?.label || trait.softwareType}
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
                className={classNames(styles.formWrap, !softwareTypesData?.length ? styles.formNoTop : '')}
            >
                <p>Add a new software</p>
                <div className={styles.form}>
                    <InputSelect
                        options={softwareTypes}
                        value={selectedSoftwareType}
                        onChange={handleSoftwareTypeChange}
                        name='softwareTypes'
                        label='Software Type *'
                        error={formErrors.softwareType}
                        placeholder='Select a Software Type'
                        dirty
                    />
                    <InputText
                        name='softwareName'
                        label='Software Name *'
                        value={selectedSoftwareName}
                        onChange={handleSoftwareNameChange}
                        placeholder='Type here the Software Name'
                        tabIndex={0}
                        type='text'
                        error={formErrors.softwareName}
                        dirty
                    />
                    <div className={styles.formCTAs}>
                        {!isEditMode && <IconOutline.PlusCircleIcon />}
                        <Button
                            link
                            label={`${isEditMode ? 'Edit' : 'Add'} Software to your List`}
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

export default Software
