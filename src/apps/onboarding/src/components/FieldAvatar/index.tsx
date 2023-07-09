/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable unicorn/no-null */
/**
 * FieldAvatar
 *
 * A Form Field Is a wrapper for input to add the label to it
 */
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import classNames from 'classnames'
import _ from 'lodash'

import { Button, IconOutline } from '~/libs/ui'

import styles from './styles.module.scss'
import MemberInfo from '../../models/MemberInfo'
import AvatarPlaceholder from '../../assets/images/avatar-placeholder.png'
import ModalUploadPhoto from '../modal-upload-photo'

interface FieldAvatarProps {
    className?: string
    memberInfo?: MemberInfo,
    setMemberPhotoUrl: (photoUrl: string) => void
    updateMemberPhotoUrl: (photoUrl: string) => void
}

const FieldAvatar: FC<FieldAvatarProps> = ({
    className,
    memberInfo,
    setMemberPhotoUrl,
    updateMemberPhotoUrl,
}: FieldAvatarProps) => {
    const [imgUrl, setImgUrl] = useState<string>('')
    useEffect(() => {
        if (memberInfo) {
            setImgUrl(memberInfo.photoURL)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [memberInfo])

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
            await updateMemberPhotoUrl('')
        } catch (error) {
        }

        setIsSaving(false)
    }

    return (
        <div
            className={classNames(styles.container, className, 'd-flex flex-column gap-20 align-items-start')}
        >
            <h3>Photo</h3>
            <div className='d-flex gap-30'>
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
                    ) : (
                        <img className={styles.imgPlaceholder} src={AvatarPlaceholder} alt='avatar' />
                    )}
                </div>
                <div className='d-flex flex-column align-items-start'>
                    <span className='color-black-60'>
                        Make a great first impression to potential customers with a
                        professional photo that represents your style.
                    </span>
                    {imgUrl ? (
                        <div className='d-flex gap-8'>
                            <Button
                                size='lg'
                                secondary
                                iconToLeft
                                icon={IconOutline.UploadIcon}
                                disabled={!memberInfo || isSaving}
                                onClick={() => setIsPhotoEditMode(true)}
                                className='mt-16'
                            >
                                change
                            </Button>
                            <Button
                                size='lg'
                                secondary
                                iconToLeft
                                icon={IconOutline.TrashIcon}
                                disabled={!memberInfo || isSaving}
                                onClick={() => {
                                    handleRemovePhoto()
                                        .then(_.noop)
                                }}
                                className='mt-16'
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
                            disabled={!memberInfo}
                            onClick={() => setIsPhotoEditMode(true)}
                            className='mt-16'
                        >
                            add image
                        </Button>
                    )}
                </div>
            </div>

            {
                isPhotoEditMode && memberInfo && (
                    <ModalUploadPhoto
                        onClose={handleModifyPhotoModalClose}
                        memberInfo={memberInfo}
                        setMemberPhotoUrl={setMemberPhotoUrl}
                    />
                )
            }
        </div>
    )
}

export default FieldAvatar
