import { Dispatch, FC, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'
import { bind, isEmpty, reject, trim } from 'lodash'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { updateMemberTraitsAsync, UserProfile, UserTrait } from '~/libs/core'
import { Button, Collapsible, ConfirmModal, IconOutline, InputText } from '~/libs/ui'
import { SettingSection, SubscriptionsIcon } from '~/apps/accounts/src/lib'

import styles from './Subscriptions.module.scss'

interface SubscriptionsProps {
    subscriptionsTrait: UserTrait | undefined
    profile: UserProfile
}

const Subscriptions: FC<SubscriptionsProps> = (props: SubscriptionsProps) => {
    const formElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const [subscriptionsTypesData, setSubscriptionsTypesData]: [
        UserTrait[] | undefined,
        Dispatch<SetStateAction<UserTrait[] | undefined>>
    ] = useState<UserTrait[] | undefined>()

    const [selectedSubsctiptionName, setSelectedSubscriptionName]: [
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
        setSubscriptionsTypesData(props.subscriptionsTrait?.traits.data)
    }, [props.subscriptionsTrait])

    function toggleRemoveConfirmation(): void {
        setRemoveConfirmationOpen(!removeConfirmationOpen)
        setItemToRemove(undefined)
    }

    function handleEditBtnClick(trait: UserTrait): void {
        setItemToUpdate(trait)
        setIsEditMode(true)
        setSelectedSubscriptionName(trim(trait.name))
        setFormErrors({})
    }

    function handleTrashBtnClick(trait: UserTrait): void {
        setRemoveConfirmationOpen(true)
        setItemToRemove(trait)
    }

    function handleSubscriptionsNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedSubscriptionName(event.target.value)
    }

    function resetForm(): void {
        setSelectedSubscriptionName(undefined)
        formElRef.current.reset()
    }

    function handleFormAction(): void {
        // validate the form
        const sN: string = trim(selectedSubsctiptionName)
        const updatedFormErrors: { [key: string]: string } = {}
        const softwareTypeUpdate: UserTrait = {
            name: sN,
        }

        if (subscriptionsTypesData?.find(
            (trait: UserTrait) => trait.name === sN,
        )) {
            resetForm()
            return
        }

        if (!sN) {
            updatedFormErrors.subscriptionName = 'Subscription name is required'
        }

        if (isEmpty(updatedFormErrors)) {
            // call the API to update the trait based on action type
            if (isEditMode) {
                const updatedSubscriptionsTypesData: UserTrait[] = reject(
                    subscriptionsTypesData,
                    (trait: UserTrait) => (
                        trait.name === itemToUpdate?.name
                    ),
                ) || []

                updateMemberTraitsAsync(
                    props.profile.handle,
                    [{
                        categoryName: 'Subscription',
                        traitId: 'subscription',
                        traits: {
                            data: [
                                ...updatedSubscriptionsTypesData || [],
                                softwareTypeUpdate,
                            ],
                        },
                    }],
                )
                    .then(() => {
                        toast.success('Subscription updated successfully')
                        setSubscriptionsTypesData([
                            ...updatedSubscriptionsTypesData || [],
                            softwareTypeUpdate,
                        ])
                    })
                    .catch(() => {
                        toast.error('Error updating subscription')
                    })
                    .finally(() => {
                        resetForm()
                        setIsEditMode(false)
                    })
            } else {
                updateMemberTraitsAsync(
                    props.profile.handle,
                    [{
                        categoryName: 'Subscription',
                        traitId: 'subscription',
                        traits: {
                            data: [
                                ...subscriptionsTypesData || [],
                                softwareTypeUpdate,
                            ],
                        },
                    }],
                )
                    .then(() => {
                        toast.success('Subscription added successfully')
                        setSubscriptionsTypesData([
                            ...subscriptionsTypesData || [],
                            softwareTypeUpdate,
                        ])
                    })
                    .catch(() => {
                        toast.error('Error adding new subscription')
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
        const updatedSubscriptionsTypesData: UserTrait[] = reject(subscriptionsTypesData, (trait: UserTrait) => (
            trait.name === itemToRemove?.name
        )) || []

        updateMemberTraitsAsync(
            props.profile.handle,
            [{
                categoryName: 'Subscription',
                traitId: 'subscription',
                traits: {
                    data: updatedSubscriptionsTypesData,
                },
            }],
        )
            .then(() => {
                toast.success('Subscription deleted successfully')
                setSubscriptionsTypesData(updatedSubscriptionsTypesData)
            })
            .catch(() => {
                toast.error('Error deleting subscription')
            })
            .finally(() => {
                toggleRemoveConfirmation()
            })
    }

    return (
        <Collapsible
            header={<h3>Subscriptions</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            {
                subscriptionsTypesData?.map((trait: UserTrait) => (
                    <SettingSection
                        key={trait.name}
                        leftElement={(
                            <div className={styles.imageWrap}>
                                <SubscriptionsIcon />
                            </div>
                        )}
                        title={trait.name}
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
                className={classNames(styles.formWrap, !subscriptionsTypesData?.length ? styles.formNoTop : '')}
            >
                <p>Add a new subscription</p>
                <div className={styles.form}>
                    <InputText
                        name='subscriptionName'
                        label='Subscription Name *'
                        value={selectedSubsctiptionName}
                        onChange={handleSubscriptionsNameChange}
                        placeholder='Type here the Subscription Name'
                        tabIndex={0}
                        type='text'
                        error={formErrors.subscriptionName}
                        dirty
                    />
                    <div className={styles.formCTAs}>
                        {!isEditMode && <IconOutline.PlusCircleIcon />}
                        <Button
                            link
                            label={`${isEditMode ? 'Edit' : 'Add'} Subscription to your List`}
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

export default Subscriptions
