import {
    ChangeEvent,
    createRef,
    Dispatch,
    FC,
    RefObject,
    SetStateAction,
    useEffect,
    useState,
} from 'react'

import { useCheckIsMobile } from '~/libs/shared/lib/hooks'

import { Button } from '../../../../button'
import { InputValue } from '../../../form-input.model'

import styles from './InputFilePicker.module.scss'

interface InputFilePickerProps {
    readonly fileConfig?: {
        readonly acceptFileType?: string
        readonly maxFileSize?: number
    }
    readonly name: string
    readonly onChange: (fileList: FileList | undefined) => void
    // eslint-disable-next-line react/no-unused-prop-types
    readonly value?: InputValue
}

const InputFilePicker: FC<InputFilePickerProps> = (props: InputFilePickerProps) => {

    const isMobile: boolean = useCheckIsMobile()

    const fileInputRef: RefObject<HTMLInputElement> = createRef<HTMLInputElement>()

    const [files, setFiles]: [FileList | undefined, Dispatch<SetStateAction<FileList | undefined>>]
        = useState<FileList | undefined>(undefined)
    const [fileName, setFileName]: [string | undefined, Dispatch<SetStateAction<string | undefined>>]
        = useState<string | undefined>()

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

    function handleButtonClick(): void {
        if (fileName && fileInputRef.current) {
            setFiles(undefined)
            fileInputRef.current.value = ''
            props.onChange(undefined)
        } else {
            fileInputRef.current?.click()
        }
    }

    function handleOnChange(event: ChangeEvent<HTMLInputElement>): void {
        setFiles(event.target.files ?? undefined)
        props.onChange(event.target.files ?? undefined)
    }

    return (
        <div className={styles.filePicker}>
            {
                fileName && <p className={styles.fileName}>{fileName}</p>
            }
            <Button
                secondary
                className={styles.filePickerButton}
                label={fileName ? 'Clear' : 'Browse'}
                onClick={handleButtonClick}
                size={isMobile ? 'sm' : 'md'}
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
        </div>
    )
}

export default InputFilePicker
