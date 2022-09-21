import { createRef, Dispatch, FC, RefObject, SetStateAction, useEffect, useState } from 'react'

import { Button, IconOutline } from '../../../../../lib'

import styles from './InputImagePicker.module.scss'

interface InputImagePickerProps {
    readonly accept?: string
    readonly name: string
    readonly size?: number
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
    ])

    return (
        <div className={styles.filePicker}>
            <Button
                buttonStyle='icon'
                icon={IconOutline.PencilIcon}
                className={styles.filePickerPencil}
                onClick={() => fileInputRef.current?.click()} />
            <input
                name={props.name}
                type={'file'}
                accept={props.accept || '*'}
                className={styles.filePickerInput}
                ref={fileInputRef}
                onChange={event => setFiles(event.target.files)}
                size={props.size || Infinity}
            />
            {
                fileDataURL ? (
                    <img src={fileDataURL} className={styles.badgeImage} />
                ) : (
                    <div className={styles.filePickerPlaceholder}>UPLOAD<br />IMAGE</div>
                )
            }
        </div>
    )
}

export default InputImagePicker
