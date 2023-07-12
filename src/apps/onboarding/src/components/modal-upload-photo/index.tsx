import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react'
import { DropzoneState, useDropzone } from 'react-dropzone'
import _ from 'lodash'
import classNames from 'classnames'

import { Button } from '~/libs/ui'
import { updateMemberPhotoAsync } from '~/libs/core'

import MemberInfo from '../../models/MemberInfo'
import OnboardingBaseModal from '../onboarding-base-modal'

import styles from './styles.module.scss'

interface ModalUploadPhotoProps {
    onClose?: () => void
    memberInfo?: MemberInfo
    setMemberPhotoUrl: (photoUrl: string) => void
}

const ModalUploadPhoto: FC<ModalUploadPhotoProps> = (props: ModalUploadPhotoProps) => {
    const [myFiles, setMyFiles] = useState<File[]>([])
    const [imgUrl, setImgUrl] = useState<string>('')
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setMyFiles([...myFiles, ...acceptedFiles])
    }, [myFiles])

    const {
        getRootProps,
        getInputProps,
    }: DropzoneState = useDropzone({
        accept: 'image/jpg, image/jpeg, image/png',
        disabled: isSaving,
        maxSize: 2097152,
        minSize: 1,
        multiple: false,
        onDrop,
    })

    useEffect(() => {
        if (myFiles && myFiles.length) {
            setImgUrl(URL.createObjectURL(myFiles[0]))
        }
    }, [myFiles])

    async function handleModifyPhotoSave(): Promise<void> {
        const formData: FormData = new FormData()

        if (myFiles && myFiles.length > 0 && props.memberInfo) {
            formData.append('photo', myFiles[0])

            setIsSaving(true)
            try {
                await updateMemberPhotoAsync(props.memberInfo.handle, formData)
                props.setMemberPhotoUrl(URL.createObjectURL(myFiles[0]))
                setMyFiles([])
            } catch (error) {
            }

            setIsSaving(false)
        }
    }

    return (
        <OnboardingBaseModal
            buttons={(
                <div className='d-flex gap-16'>
                    <Button
                        secondary
                        size='lg'
                        label='cancel'
                        onClick={props.onClose}
                    />
                    <Button
                        primary
                        size='lg'
                        label='save profile picture'
                        disabled={!props.memberInfo || isSaving || !myFiles.length}
                        onClick={handleModifyPhotoSave}
                    />
                </div>
            )}
            onClose={props.onClose || _.noop}
            title='Profile Photo'
        >
            <div
                className={classNames(
                    styles.modalContent,
                    'd-flex mobile-flex-column align-items-start mobile-gap-16',
                )}
            >
                {(!isSaving && !imgUrl) ? (
                    <div {...getRootProps()} className={styles.blockDropZone}>
                        <input {...getInputProps()} />
                        <span className={styles.textDragAndDrop}>
                            Drag and drop your file here
                            <br />
                            or
                        </span>
                        <span className={styles.textBrowse}>
                            BROWSE
                        </span>
                    </div>
                ) : undefined}

                {(!isSaving && imgUrl) ? (
                    <div {...getRootProps()} className={styles.blockPhoto}>
                        <input {...getInputProps()} />
                        <img src={imgUrl} alt='' />
                    </div>
                ) : undefined}

                {isSaving ? (
                    <div className={styles.blockDropZone}>
                        <span>Uploading...</span>
                        <div className={styles.blockProgressContainer}>
                            <div className={styles.blockProgress} />
                        </div>
                    </div>
                ) : undefined}

                <div className='d-flex flex-column align-items-start'>
                    <span>Add a photo that you would like to share to the customers and community members.</span>
                    <br />
                    <span className='text-bold'>Requirements:</span>
                    <ul className={styles.listRequirements}>
                        <li>PNG or JPG format.</li>
                        <li>Maximum size: 2MB.</li>
                    </ul>
                </div>
            </div>
        </OnboardingBaseModal>
    )
}

export default ModalUploadPhoto
