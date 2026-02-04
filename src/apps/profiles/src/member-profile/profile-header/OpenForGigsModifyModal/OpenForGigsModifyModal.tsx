import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { BaseModal, Button } from '~/libs/ui'
import {
    updateOrCreateMemberTraitsAsync,
    UserProfile,
    UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'
import { OpenToWorkData } from '~/libs/shared/lib/components/modify-open-to-work-modal'
import {
    updateMemberProfile,
} from '~/libs/core/lib/profile/profile-functions/profile-store/profile-xhr.store'
import { upsertTrait } from '~/libs/shared/lib/utils/methods'
import OpenToWorkForm from '~/libs/shared/lib/components/modify-open-to-work-modal/ModifyOpenToWorkModal'

import styles from './OpenForGigsModifyModal.module.scss'

interface OpenForGigsModifyModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
    memberPersonalizationTraits?: UserTrait[]
    mutatePersonalizationTraits: () => void
}

const OpenForGigsModifyModal: FC<OpenForGigsModifyModalProps> = (props: OpenForGigsModifyModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const memberPersonalizationTraits = props.memberPersonalizationTraits

    const [formValue, setFormValue] = useState<OpenToWorkData>({
        availability: undefined,
        availableForGigs: !!props.profile.availableForGigs,
        preferredRoles: [],
    })

    useEffect(() => {
        if (!memberPersonalizationTraits) return

        const personalizationData = memberPersonalizationTraits?.[0]?.traits?.data || []

        const openToWorkItem = personalizationData.find(
            (item: UserTrait) => item?.openToWork,
        )?.openToWork ?? {}

        setFormValue(prev => ({
            ...prev,
            availability: openToWorkItem?.availability,
            availableForGigs: !!props.profile.availableForGigs,
            preferredRoles: openToWorkItem?.preferredRoles ?? [],
        }))
    }, [
        memberPersonalizationTraits,
        props.profile.availableForGigs,
    ])

    function handleOpenForWorkSave(): void {
        setIsSaving(true)

        const existingData = memberPersonalizationTraits?.[0]?.traits?.data || []

        const personalizationData = upsertTrait(
            'openToWork',
            {
                availability: formValue.availability,
                preferredRoles: formValue.preferredRoles,
            },
            existingData,
        )

        Promise.all([
        // Update availableForGigs in member profile
            updateMemberProfile(props.profile.handle, { availableForGigs: formValue.availableForGigs }),

            // Update personalization trait for availability & preferredRoles
            updateOrCreateMemberTraitsAsync(props.profile.handle, [{
                categoryName: UserTraitCategoryNames.personalization,
                traitId: UserTraitIds.personalization,
                traits: {
                    data: personalizationData,
                },
            }]),
        ])
            .then(() => {
                toast.success('Work availability updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.mutatePersonalizationTraits()
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update your work availability', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
            })
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
            </div>

            <OpenToWorkForm
                value={formValue}
                onChange={setFormValue}
                disabled={isSaving}
            />
        </BaseModal>
    )
}

export default OpenForGigsModifyModal
