import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { BaseModal, Button } from '~/libs/ui'
import { useMemberTraits, UserProfile, UserTraitIds, UserTraits } from '~/libs/core'
import { OpenToWorkData } from '~/libs/shared/lib/components/modify-open-to-work-modal'
import {
    updateMemberProfile,
    upsertMemberTraits } from '~/libs/core/lib/profile/profile-functions/profile-store/profile-xhr.store'
import { createPersonalizationsPayloadData } from '~/apps/onboarding/src/redux/actions/member'
import OpenToWorkForm from '~/libs/shared/lib/components/modify-open-to-work-modal/ModifyOpenToWorkModal'

import styles from './OpenForGigsModifyModal.module.scss'

interface OpenForGigsModifyModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
}

const OpenForGigsModifyModal: FC<OpenForGigsModifyModalProps> = (props: OpenForGigsModifyModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const { data: memberPersonalizationTraits }: {
            data: UserTraits[] | undefined,
        } = useMemberTraits(
            props.profile.handle,
            { traitIds: UserTraitIds.personalization },
        )

    const personalizationTrait = memberPersonalizationTraits?.[0] || undefined

    const [formValue, setFormValue] = useState<OpenToWorkData>({
        availability: 'FULL_TIME',
        availableForGigs: !!props.profile.availableForGigs,
        preferredRoles: [],
    })

    useEffect(() => {
        if (!memberPersonalizationTraits) return

        const personalizationData = memberPersonalizationTraits?.[0]?.traits?.data?.[0]?.openToWork || {}

        setFormValue({
            availability: personalizationData.availability ?? 'FULL_TIME',
            availableForGigs: !!props.profile.availableForGigs,
            preferredRoles: personalizationData.preferredRoles ?? [],
        })
    }, [
        memberPersonalizationTraits,
        props.profile.availableForGigs,
    ])

    function handleOpenForWorkSave(): void {
        setIsSaving(true)

        const traitsPayload = createPersonalizationsPayloadData([{
            availability: formValue.availability,
            preferredRoles: formValue.preferredRoles,
        }])

        Promise.all([
        // Update availableForGigs in member profile
            updateMemberProfile(props.profile.handle, { availableForGigs: formValue.availableForGigs }),

            // Update personalization trait for availability & preferredRoles
            upsertMemberTraits(props.profile.handle, traitsPayload, !!personalizationTrait),
        ])
            .then(() => {
                toast.success('Work availability updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
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
