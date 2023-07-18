/**
 * FieldAvatar
 *
 * A Form Field Is a wrapper for input to add the label to it
 */
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import classNames from 'classnames'

import { Button, IconOutline } from '~/libs/ui'

import AvatarPlaceholder from '../../assets/images/avatar-placeholder.png'
import MemberInfo from '../../models/MemberInfo'
import ModalUploadPhoto from '../modal-upload-photo'

import styles from './styles.module.scss'

interface FieldAvatarProps {
    className?: string
    memberInfo?: MemberInfo,
    setMemberPhotoUrl: (photoUrl: string) => void
    updateMemberPhotoUrl: (photoUrl: string) => void
}

const FieldAvatar: FC<FieldAvatarProps> = (props: FieldAvatarProps) => {
    const [imgUrl, setImgUrl] = useState<string>('')
    useEffect(() => {
        if (props.memberInfo) {
            setImgUrl(props.memberInfo.photoURL)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [props.memberInfo])

    const [isPhotoEditMode, setIsPhotoEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleModifyPhotoModalClose(): void {
        setIsPhotoEditMode(false)
    }

    async function handleRemovePhoto(): Promise<void> {
        setIsSaving(true)
        try {
            await props.updateMemberPhotoUrl('')
        } catch (error) {
        }

        setIsSaving(false)
    }

    function showEditPhoto(): void {
        setIsPhotoEditMode(true)
    }

    const bottomButtons = imgUrl ? (
        <div className='d-flex gap-8 mobile-full-width'>
            <Button
                size='lg'
                secondary
                iconToLeft
                icon={IconOutline.UploadIcon}
                disabled={!props.memberInfo || isSaving}
                onClick={showEditPhoto}
                className='mt-16 mobile-flex-1'
            >
                change
            </Button>
            <Button
                size='lg'
                secondary
                iconToLeft
                icon={IconOutline.TrashIcon}
                disabled={!props.memberInfo || isSaving}
                onClick={handleRemovePhoto}
                className='mt-16 mobile-flex-1'
            >
                delete
            </Button>
        </div>
    ) : (
        <Button
            size='lg'
            secondary
            iconToLeft
            icon={IconOutline.UploadIcon}
            disabled={!props.memberInfo}
            onClick={showEditPhoto}
            className='mt-16 mobile-flex-1'
        >
            add image
        </Button>
    )

    return (
        <div
            className={classNames(styles.container, props.className, 'd-flex flex-column align-items-start')}
        >
            <h3>Photo</h3>
            <div className='d-flex gap-30 mt-16'>
                <div className={classNames(
                    'd-flex',
                    styles.blockImg,
                    {
                        [styles.haveImg]: !!imgUrl,
                    },
                )}
                >
                    {imgUrl ? (
                        <img className={styles.img} src={imgUrl} alt='avatar' />
                    ) : undefined}
                    {!imgUrl ? (
                        <img className={styles.imgPlaceholder} src={AvatarPlaceholder} alt='avatar' />
                    ) : undefined}
                </div>
                <div className='d-flex flex-column align-items-start'>
                    <span className='color-black-60'>
                        Make a great first impression to potential customers with a
                        professional photo that represents your style.
                    </span>
                    <div className='mobile-hide'>
                        {bottomButtons}
                    </div>
                </div>
            </div>
            <div className='desktop-hide full-width d-flex'>
                {bottomButtons}
            </div>

            {
                isPhotoEditMode && props.memberInfo && (
                    <ModalUploadPhoto
                        onClose={handleModifyPhotoModalClose}
                        memberInfo={props.memberInfo}
                        setMemberPhotoUrl={props.setMemberPhotoUrl}
                    />
                )
            }
        </div>
    )
}

export default FieldAvatar
