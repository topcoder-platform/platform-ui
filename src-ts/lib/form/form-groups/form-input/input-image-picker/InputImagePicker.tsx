import { ChangeEvent, createRef, Dispatch, FC, RefObject, SetStateAction, useEffect, useState } from 'react'

import { Button, IconOutline } from '../../../..'
import { InputValue } from '../../../form-input.model'

import styles from './InputImagePicker.module.scss'

interface InputImagePickerProps {
    readonly fileConfig?: {
        readonly acceptFileType?: string
        readonly maxFileSize?: number
    }
    readonly name: string
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
    readonly value?: InputValue
}

const InputImagePicker: FC<InputImagePickerProps> = (props: InputImagePickerProps) => {

    const fileInputRef: RefObject<HTMLInputElement> = createRef<HTMLInputElement>()

    // tslint:disable-next-line:no-null-keyword
    const [files, setFiles]: [FileList | null, Dispatch<SetStateAction<FileList | null>>] = useState<FileList | null>(null)
    const [fileDataURL, setFileDataURL]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState<string | undefined>()

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

    return (
        <div className={styles.filePicker}>
            <Button
                buttonStyle='icon'
                icon={IconOutline.PencilIcon}
                className={styles.filePickerPencil}
                onClick={() => fileInputRef.current?.click()}
            />
            <input
                name={props.name}
                type='file'
                accept={props.fileConfig?.acceptFileType || '*'}
                className={styles.filePickerInput}
                ref={fileInputRef}
                onChange={event => {
                    setFiles(event.target.files)
                    props.onChange(event)
                }}
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
