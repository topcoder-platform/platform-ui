import {
    ChangeEvent,
    FC,
    FormEvent,
    MouseEvent,
    useCallback,
    useMemo,
    useState,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import { Button } from '~/libs/ui'

import { FormFieldWrapper } from '../../../../../lib/components/form/FormFieldWrapper'
import {
    ChallengeEditorFormData,
    ChallengeMetadata,
} from '../../../../../lib/models'
import {
    getMetadataValue,
    setMetadataValue,
} from '../../../../../lib/utils/metadata.utils'

import styles from './FinalDeliverablesField.module.scss'

const FILE_TYPES_METADATA_NAME = 'fileTypes'

/**
 * Normalizes a single final-deliverable label coming from either user input or saved metadata.
 *
 * @param value raw file-type value from the input or metadata payload.
 * @returns the trimmed file-type label, or `undefined` when the value is empty.
 */
function normalizeFileTypeValue(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value.trim()

    return normalizedValue || undefined
}

/**
 * Parses the persisted `fileTypes` challenge metadata into a unique, display-ready list.
 *
 * @param value serialized challenge metadata entry for final deliverables.
 * @returns normalized file-type labels in the saved order, excluding empty or duplicate values.
 */
function parseFileTypesMetadata(value: string | undefined): string[] {
    if (!value) {
        return []
    }

    try {
        const parsedValue = JSON.parse(value) as unknown

        if (!Array.isArray(parsedValue)) {
            return []
        }

        const addedFileTypes = new Set<string>()

        return parsedValue
            .map(item => normalizeFileTypeValue(item))
            .filter((item): item is string => {
                if (!item) {
                    return false
                }

                const normalizedKey = item.toLowerCase()

                if (addedFileTypes.has(normalizedKey)) {
                    return false
                }

                addedFileTypes.add(normalizedKey)

                return true
            })
    } catch {
        return []
    }
}

/**
 * Edits the design challenge final-deliverables metadata stored under `fileTypes`.
 *
 * The field mirrors the legacy work-manager behavior used on design challenge drafts:
 * users can add or remove deliverable file types, and the component persists them as the
 * JSON-serialized `fileTypes` metadata entry on the challenge form.
 *
 * @returns the final-deliverables editor UI.
 */
export const FinalDeliverablesField: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const dynamicFormControl = formContext.control as any
    const metadata = useWatch({
        control: dynamicFormControl,
        name: 'metadata',
    }) as ChallengeMetadata[] | undefined
    const [newFileType, setNewFileType] = useState<string>('')

    const fileTypes = useMemo(
        () => parseFileTypesMetadata(getMetadataValue(metadata, FILE_TYPES_METADATA_NAME)),
        [metadata],
    )

    const normalizedNewFileType = normalizeFileTypeValue(newFileType)
    const isDuplicateValue = !!normalizedNewFileType && fileTypes
        .some(fileType => fileType.toLowerCase() === normalizedNewFileType.toLowerCase())

    const updateFileTypes = useCallback((nextFileTypes: string[]): void => {
        formContext.setValue(
            'metadata',
            setMetadataValue(
                metadata,
                FILE_TYPES_METADATA_NAME,
                JSON.stringify(nextFileTypes),
            ),
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        )
    }, [formContext, metadata])

    const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setNewFileType(event.target.value)
    }, [])

    const handleAddFileType = useCallback((event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault()

        if (!normalizedNewFileType || isDuplicateValue) {
            return
        }

        updateFileTypes([
            ...fileTypes,
            normalizedNewFileType,
        ])
        setNewFileType('')
    }, [
        fileTypes,
        isDuplicateValue,
        normalizedNewFileType,
        updateFileTypes,
    ])

    const handleRemoveFileType = useCallback((fileTypeToRemove: string): void => {
        updateFileTypes(fileTypes.filter(fileType => fileType !== fileTypeToRemove))
    }, [fileTypes, updateFileTypes])

    const handleRemoveButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const fileTypeToRemove = normalizeFileTypeValue(event.currentTarget.value)

        if (!fileTypeToRemove) {
            return
        }

        handleRemoveFileType(fileTypeToRemove)
    }, [handleRemoveFileType])

    return (
        <FormFieldWrapper
            className={styles.container}
            label='Final Deliverables'
            name='finalDeliverables'
        >
            {fileTypes.length
                ? (
                    <ul className={styles.fileTypeList}>
                        {fileTypes.map(fileType => (
                            <li
                                className={styles.fileTypeItem}
                                key={fileType}
                            >
                                <span>{fileType}</span>
                                <button
                                    aria-label={`Remove ${fileType}`}
                                    className={styles.removeButton}
                                    onClick={handleRemoveButtonClick}
                                    type='button'
                                    value={fileType}
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                )
                : undefined}

            <form
                className={styles.form}
                onSubmit={handleAddFileType}
            >
                <input
                    className={styles.input}
                    id='finalDeliverables'
                    onChange={handleInputChange}
                    placeholder='Add final deliverable file type'
                    type='text'
                    value={newFileType}
                />
                <Button
                    disabled={!normalizedNewFileType || isDuplicateValue}
                    label='Add File Type'
                    secondary
                    size='sm'
                    type='submit'
                />
            </form>
        </FormFieldWrapper>
    )
}

export default FinalDeliverablesField
