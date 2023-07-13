import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { reject } from 'lodash'

import { BaseModal, Button, FormToggleSwitch } from '~/libs/ui'
import {
    createMemberTraitsAsync,
    updateMemberTraitsAsync,
    UserProfile,
    UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'

import styles from './OpenForGigsModifyModal.module.scss'

interface OpenForGigsModifyModalProps {
    onClose: () => void
    onSave: () => void
    openForWork: boolean
    memberPersonalizationTraitsFullData: UserTrait[] | undefined
    profile: UserProfile
}

const methodsMap: { [key: string]: any } = {
    create: createMemberTraitsAsync,
    update: updateMemberTraitsAsync,
}

const OpenForGigsModifyModal: FC<OpenForGigsModifyModalProps> = (props: OpenForGigsModifyModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [openForWork, setOpenForWork]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(props.openForWork)

    useEffect(() => {
        setOpenForWork(props.openForWork)
    }, [props.openForWork])

    function handleOpenForWorkSave(): void {
        setIsSaving(true)

        const updatedPersonalizationTraits: UserTrait[]
            = reject(props.memberPersonalizationTraitsFullData, (trait: UserTrait) => !!trait.availableForGigs)

        methodsMap[!!props.memberPersonalizationTraitsFullData ? 'update' : 'create'](props.profile.handle, [{
            categoryName: UserTraitCategoryNames.personalization,
            traitId: UserTraitIds.personalization,
            traits: {
                data: [
                    ...(updatedPersonalizationTraits || []),
                    {
                        availableForGigs: openForWork,
                    },
                ],
            },
        }])
            .then(() => {
                toast.success('Work availability updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update your work availability', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
            })

        props.onSave()
    }

    function handleOpenForWorkToggle(): void {
        setOpenForWork(!openForWork)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            title='Gig Availability'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleOpenForWorkSave}
                        primary
                        disabled={isSaving}
                    />
                </div>
            )}
        >
            <div className={styles.modalBody}>
                <p>
                    {openForWork
                        ? 'Currently available for work.'
                        : `Mark your availability to get found in search results when potential
 clients look for services and let them reach out to you for free.`}
                </p>
                <FormToggleSwitch
                    name='openForWork'
                    onChange={handleOpenForWorkToggle}
                    value={openForWork}
                />
            </div>
        </BaseModal>
    )
}

export default OpenForGigsModifyModal
