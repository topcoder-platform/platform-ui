import {
    ChangeEvent,
    FC,
    KeyboardEvent,
    MouseEvent,
    useCallback,
    useMemo,
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
import {
    FILE_TYPES_METADATA_NAME,
    normalizeFileTypeValue,
    parseFileTypesMetadata,
} from '../../../../../lib/utils/final-deliverables.utils'

import styles from './FinalDeliverablesField.module.scss'

/**
 * Edits the design challenge final-deliverables metadata stored under `fileTypes`.
 *
 * The field mirrors the legacy work-manager behavior used on design challenge drafts:
 * users can add or remove deliverable file types, and the component persists them as the
 * JSON-serialized `fileTypes` metadata entry on the challenge form. The pending input
 * also belongs to the form so create and save actions can include it without an Add click.
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
    const newFileType = useWatch({
        control: dynamicFormControl,
        name: 'finalDeliverable',
    }) as string | undefined

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
        formContext.setValue('finalDeliverable', event.target.value, { shouldDirty: true })
    }, [formContext])

    const handleAddFileType = useCallback((): void => {
        if (!normalizedNewFileType || isDuplicateValue) {
            return
        }

        updateFileTypes([
            ...fileTypes,
            normalizedNewFileType,
        ])
        formContext.setValue('finalDeliverable', '', { shouldDirty: true })
    }, [
        fileTypes,
        formContext,
        isDuplicateValue,
        normalizedNewFileType,
        updateFileTypes,
    ])

    const handleInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key !== 'Enter') {
            return
        }

        // Prevent the parent challenge editor form from submitting when this nested control handles Enter.
        event.preventDefault()
        handleAddFileType()
    }, [handleAddFileType])

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

            <div
                className={styles.form}
            >
                <input
                    className={styles.input}
                    id='finalDeliverables'
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder='Add final deliverable file type'
                    type='text'
                    value={newFileType || ''}
                />
                <Button
                    disabled={!normalizedNewFileType || isDuplicateValue}
                    label='Add File Type'
                    onClick={handleAddFileType}
                    secondary
                    size='sm'
                    type='button'
                />
            </div>
        </FormFieldWrapper>
    )
}

export default FinalDeliverablesField
