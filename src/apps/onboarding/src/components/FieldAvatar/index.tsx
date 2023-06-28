/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable unicorn/no-null */
/**
 * FieldAvatar
 *
 * A Form Field Is a wrapper for input to add the label to it
 */
import React, { Dispatch, FC, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import _ from 'lodash'

import { Button, IconOutline } from '~/libs/ui'
import { updateMemberPhotoAsync } from '~/libs/core'

import styles from './styles.module.scss'
import MemberInfo from '../../models/MemberInfo'

interface FieldAvatarProps {
    className?: string
    memberInfo?: MemberInfo,
}

const FieldAvatar: FC<FieldAvatarProps> = ({
    className,
    memberInfo,
}: FieldAvatarProps) => {
    const fileElRef: MutableRefObject<HTMLDivElement | any> = useRef()
    const [imgUrl, setImgUrl] = useState<string>('')
    useEffect(() => {
        if (memberInfo && !imgUrl) {
            setImgUrl(memberInfo.photoURL)
        }
    /* eslint-disable react-hooks/exhaustive-deps */
    }, [memberInfo])

    const [file, setFile]: [File | undefined, Dispatch<SetStateAction<File | undefined>>]
        = useState<File | undefined>(undefined)
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleFilePickChange(event: React.ChangeEvent<HTMLInputElement>): void {
        const pickedFile: File | undefined = event.target.files?.[0]

        if (pickedFile && pickedFile?.size < 2000000) { // max 2mb limit
            setFile(pickedFile)
        } else {
            setFile(undefined)
        }
    }

    async function handleModifyPhotoSave(): Promise<void> {
        const formData: FormData = new FormData()

        if (file && memberInfo) {
            formData.append('photo', file)

            setIsSaving(true)
            try {
                await updateMemberPhotoAsync(memberInfo.handle, formData)
            } catch (error) {
            }

            setIsSaving(false)
        }
    }

    useEffect(() => {
        if (file) {
            setImgUrl(URL.createObjectURL(file))
            handleModifyPhotoSave()
                .then(_.noop)
        }
    /* eslint-disable react-hooks/exhaustive-deps */
    }, [file])

    return (
        <div
            className={classNames(styles.container, className, 'd-flex flex-column gap-20 align-items-start')}
        >
            <h3>A picture can speek a thousand words</h3>
            <div className='d-flex gap-30'>
                <div className={classNames(
                    'd-flex',
                    styles.blockImg,
                    {
                        [styles.haveImg]: !!imgUrl,
                    },
                )}
                >
                    {imgUrl ? (<img src={imgUrl} alt='avatar' />) : null}
                </div>
                <div className='d-flex flex-column'>
                    <strong>Requirements:</strong>
                    <ul>
                        <li>PNG or JPG format.</li>
                        <li>Maximum size: 2MB.</li>
                    </ul>
                </div>
            </div>
            <input
                ref={fileElRef}
                accept='image/png, image/jpg'
                type='file'
                onChange={handleFilePickChange}
                hidden
            />
            <Button
                size='lg'
                secondary
                iconToRight
                icon={IconOutline.DownloadIcon}
                disabled={!memberInfo || isSaving}
                onClick={() => fileElRef.current.click()}
            >
                upload photo
            </Button>
        </div>
    )
}

export default FieldAvatar
