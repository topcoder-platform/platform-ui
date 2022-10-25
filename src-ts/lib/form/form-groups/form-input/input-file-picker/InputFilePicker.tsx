// tslint:disable:no-null-keyword
import { createRef, Dispatch, FC, RefObject, SetStateAction, useEffect, useState } from 'react'

import { Button, useCheckIsMobile } from '../../../..'
import { InputValue } from '../../../form-input.model'

import styles from './InputFilePicker.module.scss'

interface InputFilePickerProps {
    readonly fileConfig?: {
        readonly acceptFileType?: string
        readonly maxFileSize?: number
    }
    readonly name: string
    readonly onChange: (fileList: FileList | null) => void
    readonly value?: InputValue
}

const InputFilePicker: FC<InputFilePickerProps> = (props: InputFilePickerProps) => {

    const isMobile: boolean = useCheckIsMobile()

    const fileInputRef: RefObject<HTMLInputElement> = createRef<HTMLInputElement>()

    const [files, setFiles]: [FileList | null, Dispatch<SetStateAction<FileList | null>>] = useState<FileList | null>(null)
    const [fileName, setFileName]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState<string | undefined>()

    useEffect(() => {
        if (files && files.length) {
            setFileName(files[0].name)
        } else if (fileName) {
            setFileName(undefined)
        }
    }, [
        files,
        fileName,
    ])

    return (
        <div className={styles.filePicker}>
            {
                fileName && <p className={styles.fileName}>{fileName}</p>
            }
            <Button
                buttonStyle='secondary'
                className={styles.filePickerButton}
                label={fileName ? 'Clear' : 'Browse'}
                onClick={() => {
                    if (fileName && fileInputRef.current) {
                        setFiles(null)
                        fileInputRef.current.value = ''
                        props.onChange(null)
                    } else {
                        fileInputRef.current?.click()
                    }
                }}
                size={isMobile ? 'xs' : 'sm'}
            />
            <input
                name={props.name}
                type={'file'}
                accept={props.fileConfig?.acceptFileType || '*'}
                className={styles.filePickerInput}
                ref={fileInputRef}
                onChange={event => {
                    setFiles(event.target.files)
                    props.onChange(event.target.files)
                }}
                size={props.fileConfig?.maxFileSize || Infinity}
            />
        </div>
    )
}

export default InputFilePicker
