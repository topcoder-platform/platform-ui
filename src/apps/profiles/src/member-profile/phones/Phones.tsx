import { Dispatch, FC, SetStateAction, useState } from 'react'

import { UserProfile } from '~/libs/core'
import { CopyButton } from '~/apps/admin/src/lib/components/CopyButton'

import { AddButton, EditMemberPropertyBtn, EmptySection } from '../../components'
import ModifyPhonesModal from './ModifyPhonesModal'
import PhoneCard from './PhoneCard'
import styles from './Phones.module.scss'

interface PhonesProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
    refreshProfile: (handle: string) => void
}

const Phones: FC<PhonesProps> = (props: PhonesProps) => {
    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const phones = props.profile.phones || []

    function handleEditPhonesClick(): void {
        setIsEditMode(true)
    }

    function handleModifyPhonesModalClose(): void {
        setIsEditMode(false)
    }

    function handleModifyPhonesSave(): void {
        setTimeout(() => {
            setIsEditMode(false)
            props.refreshProfile(props.profile.handle)
        }, 1000)
    }

    return (
        <div className={styles.container}>
            <div className={styles.titleWrap}>
                <p className='body-main-bold'>Contact</p>
                {props.profile?.email && (
                    <div className={styles.email}>
                        <p className={styles.emailText}>{props.profile.email}</p>
                        <CopyButton className={styles.copyButton} text={props.profile.email} />
                    </div>
                )}
            </div>

            {phones.length > 0 && (
                <div className={styles.phonesHeader}>
                    {canEdit && (
                        <EditMemberPropertyBtn
                            onClick={handleEditPhonesClick}
                        />
                    )}
                </div>
            )}

            <div className={styles.phonesContent}>
                {phones.length > 0
                    ? phones.map((phone, index: number) => (
                        <PhoneCard
                            key={`${phone.type}-${phone.number}-${index}`}
                            type={phone.type}
                            number={phone.number}
                        />
                    ))
                    : (
                        <EmptySection
                            selfMessage='Adding contact information helps others reach you.'
                            isSelf={canEdit}
                        >
                            This member has not added contact phone numbers.
                        </EmptySection>
                    )}
                {canEdit && !phones.length && (
                    <AddButton
                        label='Add phone number'
                        onClick={handleEditPhonesClick}
                    />
                )}
            </div>

            {
                isEditMode && (
                    <ModifyPhonesModal
                        onClose={handleModifyPhonesModalClose}
                        onSave={handleModifyPhonesSave}
                        profile={props.profile}
                        phones={phones}
                    />
                )
            }
        </div>
    )
}

export default Phones
