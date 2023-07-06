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

    const [fileSizeError, setFileSizeError]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

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
                setFile(pickedFile)
                setFileSizeError(false)
            } else {
                setFileSizeError(true)
            }
        } else {
            setFile(undefined)
            setFileSizeError(false)
        }
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            title='Your Photo'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleModifyPhotoSave}
                        primary
                        disabled={isSaving || !file}
                    />
                </div>
            )}
        >
            <div className={styles.modalBody}>
                <p>Show the community who you are. Don&apos;t worry, you look great.</p>
                <p className='body-main-bold'>Requirements:</p>
                <ul>
                    <li>PNG or JPG format.</li>
                    <li>Maximum size: 2MB.</li>
                </ul>
                <form>
                    <input
                        ref={fileElRef}
                        accept='image/png,image/jpeg'
                        type='file'
                        onChange={handleFilePickChange}
                    />
                    <Button
                        label='Upload New Photo'
                        primary
                        onClick={handleFilePickClick}
                    />
                    {
                        fileSizeError && (
                            <p>Please select an image that is less than 2MB.</p>
                        )
                    }
                </form>
                {
                    file && (
                        <div className={styles.preview}>
                            <p className='body-main-bold'>Preview:</p>
                            <img src={URL.createObjectURL(file)} alt='preview' />
                        </div>
                    )
                }
            </div>
        </BaseModal>
    )
}

export default ModifyMemberPhotoModal
