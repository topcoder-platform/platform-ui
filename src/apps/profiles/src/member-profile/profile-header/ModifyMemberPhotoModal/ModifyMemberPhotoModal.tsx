import {
    Dispatch,
    FC,
    MutableRefObject,
    SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react'
import { toast } from 'react-toastify'

import { BaseModal, Button } from '~/libs/ui'
import { updateMemberPhotoAsync, UserProfile } from '~/libs/core'

import styles from './ModifyMemberPhotoModal.module.scss'

const MAX_PHOTO_SIZE_BYTES: number = 2_000_000
const MAX_PREVIEW_DIMENSION: number = 2_048
const PNG_SIGNATURE: ReadonlyArray<number> = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]

interface PhotoPreview {
    readonly file: File
    readonly url: string
}

function hasExpectedRasterSignature(file: File, signature: Uint8Array): boolean {
    if (file.type === 'image/png') {
        return PNG_SIGNATURE.every((byte: number, index: number) => signature[index] === byte)
    }

    return file.type === 'image/jpeg'
        && signature[0] === 0xFF
        && signature[1] === 0xD8
        && signature[2] === 0xFF
}

function readFileSignature(file: File): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
        const reader: FileReader = new FileReader()
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(new Uint8Array(reader.result))
            } else {
                reject(new Error('The selected image signature could not be read.'))
            }
        }

        reader.onerror = () => reject(reader.error || new Error('The selected image could not be read.'))
        reader.readAsArrayBuffer(file.slice(0, PNG_SIGNATURE.length))
    })
}

async function createValidatedRasterPreviewUrl(file: File): Promise<string> {
    const signature: Uint8Array = await readFileSignature(file)
    if (!hasExpectedRasterSignature(file, signature)) {
        throw new Error('The selected file does not have a valid PNG or JPEG signature.')
    }

    const bitmap: ImageBitmap = await window.createImageBitmap(file)

    try {
        if (!bitmap.width || !bitmap.height) {
            throw new Error('The selected image has invalid dimensions.')
        }

        const previewScale: number = Math.min(
            1,
            MAX_PREVIEW_DIMENSION / bitmap.width,
            MAX_PREVIEW_DIMENSION / bitmap.height,
        )
        const canvas: HTMLCanvasElement = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(bitmap.width * previewScale))
        canvas.height = Math.max(1, Math.round(bitmap.height * previewScale))

        const context: CanvasRenderingContext2D | null = canvas.getContext('2d')
        if (!context) {
            throw new Error('An image preview could not be created.')
        }

        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

        const previewBlob: Blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob: Blob | null) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('An image preview could not be encoded.'))
                    }
                },
                file.type,
                0.9,
            )
        })

        return URL.createObjectURL(previewBlob)
    } finally {
        bitmap.close()
    }
}

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

    const [preview, setPreview]: [PhotoPreview | undefined, Dispatch<SetStateAction<PhotoPreview | undefined>>]
        = useState<PhotoPreview | undefined>(undefined)

    const fileElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const [fileSelectError, setFileSelectError]: [string | undefined, Dispatch<SetStateAction<string | undefined>>]
        = useState<string | undefined>()

    useEffect(() => {
        let isActive: boolean = true
        let previewUrl: string | undefined

        setPreview(undefined)

        if (file) {
            createValidatedRasterPreviewUrl(file)
                .then((url: string) => {
                    previewUrl = url
                    if (isActive) {
                        setPreview({ file, url })
                    } else {
                        URL.revokeObjectURL(url)
                    }
                })
                .catch(() => {
                    if (isActive) {
                        setFile(undefined)
                        setFileSelectError('Please select a valid PNG or JPG image.')
                    }
                })
        }

        return () => {
            isActive = false
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [file])

    function handleModifyPhotoSave(): void {
        const formData: FormData = new FormData()

        if (file && preview?.file === file) {
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
            if (pickedFile.size <= MAX_PHOTO_SIZE_BYTES) {
                if (pickedFile.type !== 'image/png' && pickedFile.type !== 'image/jpeg') {
                    setFile(undefined)
                    setFileSelectError('Please select a PNG or JPG image.')
                    return
                }

                setFile(pickedFile)
                setFileSelectError(undefined)
            } else {
                setFile(undefined)
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
                        disabled={isSaving || !file || preview?.file !== file}
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
                        file && preview?.file === file && (
                            <div className={styles.preview}>
                                <img src={preview.url} alt='preview' />
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
