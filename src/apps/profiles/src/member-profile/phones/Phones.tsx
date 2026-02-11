import { Dispatch, FC, SetStateAction, useState } from 'react'
import classNames from 'classnames'

import { UserProfile } from '~/libs/core'
import { CopyButton } from '~/apps/admin/src/lib/components/CopyButton'
import { IconOutline, IconSolid, Tooltip } from '~/libs/ui'

import { AddButton } from '../../components'
import { canSeeEmail, canSeePhones } from '../../lib/helpers'

import { ModifyPhonesModal } from './ModifyPhonesModal'
import { PhoneCard } from './PhoneCard'
import styles from './Phones.module.scss'

interface PhonesProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
    refreshProfile: (handle: string) => void
}

const Phones: FC<PhonesProps> = (props: PhonesProps) => {
    const canEdit: boolean = props.authProfile?.handle === props.profile.handle
    const canSeePhonesValue: boolean = canSeePhones(props.authProfile, props.profile)
    const canSeeEmailValue: boolean = canSeeEmail(props.authProfile, props.profile)

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [initialEditIndex, setInitialEditIndex]: [
        number | undefined,
        Dispatch<SetStateAction<number | undefined>>
    ] = useState<number | undefined>()

    const phones = props.profile.phones || []

    function handleEditPhonesClick(): void {
        setInitialEditIndex(undefined)
        setIsEditMode(true)
    }

    function handleModifyPhonesModalClose(): void {
        setIsEditMode(false)
        setInitialEditIndex(undefined)
    }

    function handleModifyPhonesSave(): void {
        setTimeout(() => {
            setIsEditMode(false)
            setInitialEditIndex(undefined)
            props.refreshProfile(props.profile.handle)
        }, 1000)
    }

    return (
        <div className={styles.container}>
            <div className={styles.titleWrap}>
                <p className={classNames('body-main-bold', styles.title)}>
                    Contact
                    {canEdit && (
                        <Tooltip content='This information is visible to you only.' place='top'>
                            <IconOutline.EyeOffIcon width={20} height={20} />
                        </Tooltip>
                    )}
                </p>
                {canSeeEmailValue && props.profile?.email && (
                    <div className={styles.email}>
                        <div className={styles.emailIcon}>
                            <IconSolid.MailIcon width={20} height={20} />
                        </div>
                        <p className={styles.emailText}>{props.profile.email}</p>
                        <CopyButton className={styles.copyButton} text={props.profile.email} />
                    </div>
                )}
            </div>

            <div className={styles.phonesContent}>
                {phones.length > 0
                    && phones.map((phone, index: number) => (
                        <PhoneCard
                            key={`${phone.type}-${phone.number}`}
                            type={phone.type}
                            number={phone.number}
                            canEdit={canSeePhonesValue && canEdit && index === 0}
                            phoneIndex={index}
                            onEdit={index === 0 ? handleEditPhonesClick : undefined}
                        />
                    ))}
                {canEdit && phones.length === 0 && (
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
                        initialEditIndex={initialEditIndex}
                    />
                )
            }
        </div>
    )
}

export default Phones
