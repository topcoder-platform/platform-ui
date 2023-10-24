import { Dispatch, FC, MutableRefObject, SetStateAction, useRef, useState } from 'react'
import { toast } from 'react-toastify'

import { BaseModal, Button } from '~/libs/ui'
import { updateMemberPhotoAsync, UserProfile } from '~/libs/core'

import styles from './ModifyMemberPhotoModal.module.scss'

interface ModifyMemberPhotoModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
}

const ModifyMemberPhotoModal: FC<ModifyMemberPhotoModalProps> = (props: ModifyMemberPhotoModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [file, setFile]: [File | undefined, Dispatch<SetStateAction<File | undefined>>]
        = useState<File | undefined>(undefined)

    const fileElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const [fileSelectError, setFileSelectError]: [string | undefined, Dispatch<SetStateAction<string | undefined>>]
        = useState<string | undefined>()

    function handleModifyPhotoSave(): void {
        const formData: FormData = new FormData()

        if (file) {
            formData.append('photo', file)

            setIsSaving(true)

            updateMemberPhotoAsync(props.profile.handle, formData)
                .then(() => {
                    toast.success('Photo updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                    props.onSave()
                })
                .catch(() => {
                    toast.error('Failed to update your photo.', { position: toast.POSITION.BOTTOM_RIGHT })
                    setIsSaving(false)
                })
        }
    }

    function handleFilePickClick(): void {
        fileElRef.current.click()
    }

    function handleFilePickChange(event: React.ChangeEvent<HTMLInputElement>): void {
        const pickedFile: File | undefined = event.target.files?.[0]

        if (pickedFile) {
            if (pickedFile?.size < 2000000) { // max 2mb limit
                if (pickedFile.type !== 'image/png' && pickedFile.type !== 'image/jpeg') {
                    setFileSelectError('Please select a PNG or JPG image.')
                    return
                }

                setFile(pickedFile)
                setFileSelectError(undefined)
            } else {
                setFileSelectError('Please select an image that is less than 2MB.')
            }
        } else {
            setFile(undefined)
            setFileSelectError(undefined)
        }
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            title='Change Photo'
            size='lg'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save profile picture'
                        onClick={handleModifyPhotoSave}
                        primary
                        disabled={isSaving || !file}
                    />
                </div>
            )}
        >
            <div className={styles.modalBody}>
                <div className={styles.imageArea} onClick={handleFilePickClick}>
                    <form>
                        <input
                            ref={fileElRef}
                            accept='image/png,image/jpeg'
                            type='file'
                            onChange={handleFilePickChange}
                        />
                        {
                            fileSelectError && (
                                <p className={styles.error}>{fileSelectError}</p>
                            )
                        }
                        {
                            !file && !fileSelectError && (
                                <p className='body-small-bold'>Browse</p>
                            )
                        }
                    </form>
                    {
                        file && (
                            <div className={styles.preview}>
                                <img src={URL.createObjectURL(file)} alt='preview' />
                            </div>
                        )
                    }
                </div>
                <div>
                    <p>Add a photo that you would like to share to the customers and community members.</p>
                    <p className='body-main-bold'>Requirements:</p>
                    <ul>
                        <li>PNG or JPG format.</li>
                        <li>Maximum size: 2MB.</li>
                    </ul>
                </div>
            </div>
        </BaseModal>
    )
}

export default ModifyMemberPhotoModal
