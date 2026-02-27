/* eslint-disable complexity */
import {
    ChangeEvent,
    DragEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    Client,
    init,
    PickerFileMetadata,
    PickerOptions,
    StoreUploadOptions,
    UploadOptions,
} from 'filestack-js'
import classNames from 'classnames'

import { EnvironmentConfig } from '~/config'
import { Button } from '~/libs/ui'

import styles from './FilePicker.module.scss'

// eslint-disable-next-line max-len
const URL_REGEX = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i

export interface FilestackData {
    container: string
    fileType?: string
    fileUrl: string
    filename: string
    key: string
    mimetype: string
    size: number
}

export interface FilePickerProps {
    challengeId: string
    isTopGear: boolean
    onError: (message: string) => void
    onFileSelected: (data: FilestackData) => void
    userId: string
}

function getDomainRegexPattern(): string | undefined {
    const pattern = EnvironmentConfig.TOPGEAR_ALLOWED_SUBMISSIONS_DOMAINS?.trim()
    return pattern || undefined
}

function isDomainAllowed(url: string): boolean {
    const pattern = getDomainRegexPattern()
    if (!pattern) {
        return true
    }

    const domainReg = new RegExp(`^https?://(${pattern})/.+`)
    return domainReg.test(url)
}

function extractFilenameFromUrl(url: string): string {
    const noQuery = url.split('?')[0]
    const name = noQuery.substring(noQuery.lastIndexOf('/') + 1)
    return name || 'submission-url'
}

/**
 * Filestack-based picker for challenge submissions.
 *
 * @param props Challenge, member and callback context for file selection.
 * @returns Submission upload picker UI.
 */
const FilePicker: FC<FilePickerProps> = (props: FilePickerProps) => {
    const [client, setClient] = useState<Client | undefined>(undefined)
    const [dragged, setDragged] = useState<boolean>(false)
    const [fileName, setFileName] = useState<string>('')
    const [inputUrl, setInputUrl] = useState<string>('')
    const [invalidDomain, setInvalidDomain] = useState<boolean>(false)
    const [invalidUrl, setInvalidUrl] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined)

    useEffect(() => {
        if (props.isTopGear) {
            return
        }

        try {
            const nextClient = init(EnvironmentConfig.FILESTACK.API_KEY, {
                cname: EnvironmentConfig.FILESTACK.CNAME,
                security: EnvironmentConfig.FILESTACK.SECURITY
                    ? {
                        policy: EnvironmentConfig.FILESTACK.SECURITY.POLICY,
                        signature: EnvironmentConfig.FILESTACK.SECURITY.SIGNATURE,
                    }
                    : undefined,
            })
            setClient(nextClient)
        } catch (error) {
            props.onError(
                error instanceof Error
                    ? error.message
                    : 'Failed to initialize uploader.',
            )
        }
    }, [props.isTopGear, props.onError])

    const getStorePath = useCallback((): string => (
        `${props.challengeId}-${props.userId}-SUBMISSION_ZIP-${Date.now()}.zip`
    ), [props.challengeId, props.userId])

    const onUploadSuccess = useCallback((file: PickerFileMetadata, path: string): void => {
        const container = file.container || EnvironmentConfig.FILESTACK.CONTAINER
        const selectedFileName = file.filename || file.originalPath || path
        setFileName(selectedFileName)
        setUploadProgress(undefined)
        props.onError('')
        props.onFileSelected({
            container,
            filename: selectedFileName,
            fileUrl: `https://s3.amazonaws.com/${container}/${path}`,
            key: file.key || path,
            mimetype: file.mimetype || '',
            size: file.size || 0,
        })
    }, [props.onError, props.onFileSelected])

    const handleOpenPicker = useCallback((): void => {
        if (!client) {
            props.onError('Uploader is not ready yet.')
            return
        }

        const path = getStorePath()
        const storeTo = {
            container: EnvironmentConfig.FILESTACK.CONTAINER,
            path,
            region: EnvironmentConfig.FILESTACK.REGION,
        }
        const pickerOptions: PickerOptions = {
            accept: ['.zip'],
            fromSources: [
                'local_file_system',
                'googledrive',
                'dropbox',
                'onedrive',
                'github',
                'url',
            ],
            maxSize: 500 * 1024 * 1024,
            onFileUploadFailed: () => props.onError('File upload failed.'),
            onFileUploadFinished: file => onUploadSuccess(file, path),
            startUploadingWhenMaxFilesReached: true,
            storeTo,
        }

        client.picker(pickerOptions)
            .open()
    }, [client, getStorePath, onUploadSuccess, props.onError])

    const handleDrop = useCallback(async (event: DragEvent<HTMLDivElement>): Promise<void> => {
        event.preventDefault()
        event.stopPropagation()
        setDragged(false)

        if (!client) {
            props.onError('Uploader is not ready yet.')
            return
        }

        const file = event.dataTransfer.files?.[0]
        if (!file) {
            return
        }

        if (!file.name.endsWith('.zip')) {
            props.onError('Wrong file type. Please upload a .zip file.')
            return
        }

        setFileName(file.name)
        setUploadProgress(0)
        props.onError('')

        const path = getStorePath()
        const uploadOptions: UploadOptions = {
            onProgress: progress => {
                setUploadProgress(progress.totalPercent ?? 0)
            },
            progressInterval: 1000,
        }
        const storeTo: StoreUploadOptions = {
            container: EnvironmentConfig.FILESTACK.CONTAINER,
            path,
            region: EnvironmentConfig.FILESTACK.REGION,
        }

        try {
            const uploadedFile = await client.upload(file, uploadOptions, storeTo)
            onUploadSuccess(uploadedFile as PickerFileMetadata, path)
        } catch (error) {
            props.onError(
                error instanceof Error
                    ? error.message
                    : 'File upload failed.',
            )
            setUploadProgress(undefined)
        }
    }, [client, getStorePath, onUploadSuccess, props.onError])

    const handleSetTopGearUrl = useCallback((): void => {
        const validUrl = URL_REGEX.test(inputUrl)
        const validDomain = isDomainAllowed(inputUrl)

        if (!validUrl || !validDomain) {
            setInvalidUrl(!validUrl)
            setInvalidDomain(validUrl && !validDomain)
            props.onError(
                !validUrl
                    ? 'Invalid URL.'
                    : 'Ensure that you submit a valid allowed SharePoint link only.',
            )
            return
        }

        setInvalidUrl(false)
        setInvalidDomain(false)
        props.onError('')

        const filename = extractFilenameFromUrl(inputUrl)
        setFileName(filename)
        props.onFileSelected({
            container: EnvironmentConfig.FILESTACK.CONTAINER,
            filename,
            fileType: 'url',
            fileUrl: inputUrl,
            key: '',
            mimetype: '',
            size: 0,
        })
    }, [inputUrl, props.onError, props.onFileSelected])

    const handleDragEnter = useCallback((): void => {
        setDragged(true)
    }, [])
    const handleDragLeave = useCallback((): void => {
        setDragged(false)
    }, [])
    const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>): void => {
        event.preventDefault()
    }, [])
    const handleInputUrlChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setInputUrl(event.target.value)
    }, [])

    const progressLabel = useMemo(() => {
        if (uploadProgress === undefined || uploadProgress >= 100) {
            return undefined
        }

        return `${uploadProgress.toFixed(0)}%`
    }, [uploadProgress])

    return (
        <div className={styles.container}>
            <p className={styles.description}>
                {props.isTopGear
                    ? 'Set your submission URL.'
                    : 'Drag and drop your .zip file here or use the picker.'}
            </p>

            <div
                className={classNames(
                    styles.picker,
                    dragged && styles.drag,
                    props.isTopGear && styles.topgear,
                )}
                onDragEnter={!props.isTopGear ? handleDragEnter : undefined}
                onDragLeave={!props.isTopGear ? handleDragLeave : undefined}
                onDragOver={!props.isTopGear ? handleDragOver : undefined}
                onDrop={!props.isTopGear ? handleDrop : undefined}
            >
                {!!fileName && (
                    <p className={styles.filename}>
                        {fileName}
                    </p>
                )}

                {!!progressLabel && (
                    <p className={styles.upload}>
                        Uploading:
                        {' '}
                        {progressLabel}
                    </p>
                )}

                {props.isTopGear && (
                    <div className={styles.urlInputContainer}>
                        {invalidUrl && <div className={styles.invalidMessage}>* Invalid URL</div>}
                        {invalidDomain && (
                            <div className={styles.invalidMessage}>
                                Ensure that you submit a valid allowed domain link only.
                            </div>
                        )}
                        <input
                            className={classNames(invalidUrl && styles.inputInvalid)}
                            onChange={handleInputUrlChange}
                            placeholder='URL'
                            type='text'
                            value={inputUrl}
                        />
                    </div>
                )}

                <Button
                    label={props.isTopGear ? 'SET URL' : 'SELECT A FILE'}
                    onClick={props.isTopGear ? handleSetTopGearUrl : handleOpenPicker}
                    primary
                />
            </div>
        </div>
    )
}

export { FilePicker }
export default FilePicker
