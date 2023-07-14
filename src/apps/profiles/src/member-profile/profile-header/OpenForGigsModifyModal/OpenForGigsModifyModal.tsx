import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { reject } from 'lodash'

import { BaseModal, Button, InputText } from '~/libs/ui'
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
            title='Don’t miss gig and work opportunities.'
            size='lg'
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
                    By selecting “Open to Work” our customers will know that you are available for job opportunities.
                </p>
                <InputText
                    name='openForWork'
                    label='Yes, I’m open to work'
                    tabIndex={-1}
                    type='checkbox'
                    onChange={handleOpenForWorkToggle}
                    checked={openForWork}
                />
            </div>
        </BaseModal>
    )
}

export default OpenForGigsModifyModal
