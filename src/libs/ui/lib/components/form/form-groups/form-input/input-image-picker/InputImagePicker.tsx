import { ChangeEvent, createRef, Dispatch, FC, RefObject, SetStateAction, useEffect, useState } from 'react'

import { IconOutline, UiButton } from '../../../..'
import { InputValue } from '../../../form-input.model'

import styles from './InputImagePicker.module.scss'

interface InputImagePickerProps {
    readonly fileConfig?: {
        readonly acceptFileType?: string
        readonly maxFileSize?: number
    }
    readonly name: string
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
    // eslint-disable-next-line react/no-unused-prop-types
    readonly value?: InputValue
}

const InputImagePicker: FC<InputImagePickerProps> = (props: InputImagePickerProps) => {

    const fileInputRef: RefObject<HTMLInputElement> = createRef<HTMLInputElement>()

    const [files, setFiles]: [FileList | undefined, Dispatch<SetStateAction<FileList | undefined>>]
        = useState<FileList | undefined>(undefined)
    const [fileDataURL, setFileDataURL]: [string | undefined, Dispatch<SetStateAction<string | undefined>>]
        = useState<string | undefined>()

    useEffect(() => {
        if (files && files.length) {
            const fileReader: FileReader = new FileReader()
            fileReader.onload = e => {
                const { result }: any = e.target
                if (result) {
                    setFileDataURL(result)
                }
            }

            fileReader.readAsDataURL(files[0])
        } else if (fileDataURL) {
            setFileDataURL(undefined)
        }
    }, [
        files,
        fileDataURL,
    ])

    function handleButtonClick(): void {
        fileInputRef.current?.click()
    }

    function handleOnChange(event: ChangeEvent<HTMLInputElement>): void {
        setFiles(event.target.files ?? undefined)
        props.onChange(event)
    }

    return (
        <div className={styles.filePicker}>
            <UiButton
                size='lg'
                icon={IconOutline.PencilIcon}
                className={styles.filePickerPencil}
                onClick={handleButtonClick}
            />
            <input
                name={props.name}
                type='file'
                accept={props.fileConfig?.acceptFileType || '*'}
                className={styles.filePickerInput}
                ref={fileInputRef}
                onChange={handleOnChange}
                size={props.fileConfig?.maxFileSize || Infinity}
            />
            {
                fileDataURL ? (
                    <img src={fileDataURL} alt='Badge preview' className={styles.badgeImage} />
                ) : (
                    <div className={styles.filePickerPlaceholder}>
                        UPLOAD
                        <br />
                        IMAGE
                    </div>
                )
            }
        </div>
    )
}

export default InputImagePicker
