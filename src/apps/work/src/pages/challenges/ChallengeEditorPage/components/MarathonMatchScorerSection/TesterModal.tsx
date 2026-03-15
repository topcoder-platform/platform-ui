import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    BaseModal,
    Button,
} from '~/libs/ui'
import { java } from '@codemirror/lang-java'
import CodeMirror from '@uiw/react-codemirror'

import { ConfirmationModal } from '../../../../../lib/components'
import { MarathonMatchTester } from '../../../../../lib/models'
import {
    createTester,
    createTesterVersion,
} from '../../../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../../../lib/utils'

import styles from './MarathonMatchScorerSection.module.scss'

const SOURCE_EDITOR_EXTENSIONS = [java()]
const SOURCE_EDITOR_SETUP = {
    foldGutter: false,
    lineNumbers: true,
    searchKeymap: false,
    tabSize: 4,
}

interface ValidationErrors {
    className?: string
    name?: string
    sourceCode?: string
    version?: string
}

function compareVersionStrings(left: string, right: string): number {
    const leftParts = left.split(/[.-]/)
    const rightParts = right.split(/[.-]/)
    const maxLength = Math.max(leftParts.length, rightParts.length)

    for (let index = 0; index < maxLength; index += 1) {
        const leftPart = leftParts[index] || '0'
        const rightPart = rightParts[index] || '0'
        const leftNumber = Number(leftPart)
        const rightNumber = Number(rightPart)

        if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
            if (leftNumber !== rightNumber) {
                return leftNumber - rightNumber
            }
        } else if (leftPart !== rightPart) {
            return leftPart.localeCompare(rightPart)
        }
    }

    return 0
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallbackMessage
}

export interface TesterModalProps {
    existingTester?: MarathonMatchTester
    maxExistingVersion?: string
    mode: 'create' | 'version'
    onClose: () => void
    onCreated: (tester: MarathonMatchTester) => void
}

/**
 * Captures tester source updates and submits them for asynchronous compilation.
 * Used by `MarathonMatchScorerSection` for creating new testers and new versions.
 */
// eslint-disable-next-line complexity
export const TesterModal: FC<TesterModalProps> = (
    props: TesterModalProps,
) => {
    const existingTester: MarathonMatchTester | undefined = props.existingTester
    const maxExistingVersion: string | undefined = props.maxExistingVersion
    const mode: TesterModalProps['mode'] = props.mode
    const onClose: TesterModalProps['onClose'] = props.onClose
    const onCreated: TesterModalProps['onCreated'] = props.onCreated
    const isMountedRef = useRef<boolean>(true)
    const initialName = mode === 'create'
        ? ''
        : existingTester?.name || ''
    const initialVersion = existingTester?.version || ''
    const initialClassName = existingTester?.className || ''
    const initialSourceCode = existingTester?.sourceCode || ''

    const [name, setName] = useState<string>(initialName)
    const [version, setVersion] = useState<string>(initialVersion)
    const [className, setClassName] = useState<string>(initialClassName)
    const [sourceCode, setSourceCode] = useState<string>(initialSourceCode)
    const [errorMessage, setErrorMessage] = useState<string | undefined>()
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [showDiscardConfirmation, setShowDiscardConfirmation] = useState<boolean>(false)

    const validationErrors = useMemo((): ValidationErrors => {
        const errors: ValidationErrors = {}
        const comparisonVersion = maxExistingVersion?.trim() || existingTester?.version?.trim()

        if (mode === 'create' && !name.trim()) {
            errors.name = 'Scorer name is required.'
        }

        if (!version.trim()) {
            errors.version = 'Version is required.'
        } else if (
            mode === 'version'
            && comparisonVersion
            && compareVersionStrings(version.trim(), comparisonVersion) <= 0
        ) {
            errors.version = `Version must be greater than ${comparisonVersion}.`
        }

        if (!className.trim()) {
            errors.className = 'Class name is required.'
        }

        if (!sourceCode.trim()) {
            errors.sourceCode = 'Source code is required.'
        }

        return errors
    }, [
        className,
        existingTester,
        maxExistingVersion,
        mode,
        name,
        sourceCode,
        version,
    ])
    const hasValidationError = Object.values(validationErrors)
        .some(Boolean)
    const hasUnsavedChanges = useMemo(
        (): boolean => JSON.stringify({
            className: className.trim(),
            name: name.trim(),
            sourceCode,
            version: version.trim(),
        }) !== JSON.stringify({
            className: initialClassName.trim(),
            name: initialName.trim(),
            sourceCode: initialSourceCode,
            version: initialVersion.trim(),
        }),
        [
            className,
            initialClassName,
            initialName,
            initialSourceCode,
            initialVersion,
            name,
            sourceCode,
            version,
        ],
    )

    const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setName(event.target.value)
    }, [])

    const handleVersionChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setVersion(event.target.value)
    }, [])

    const handleClassNameChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setClassName(event.target.value)
    }, [])

    const handleSourceCodeChange = useCallback((value: string): void => {
        setSourceCode(value)
    }, [])

    const handleModalClose = useCallback((): void => {
        if (isSubmitting) {
            return
        }

        if (!hasUnsavedChanges) {
            onClose()
            return
        }

        setShowDiscardConfirmation(true)
    }, [
        hasUnsavedChanges,
        isSubmitting,
        onClose,
    ])

    const handleDiscardCancel = useCallback((): void => {
        setShowDiscardConfirmation(false)
    }, [])

    const handleDiscardConfirm = useCallback((): void => {
        setShowDiscardConfirmation(false)
        onClose()
    }, [onClose])

    const handleSubmit = useCallback(async (): Promise<void> => {
        if (isSubmitting) {
            return
        }

        if (hasValidationError) {
            setErrorMessage('Please fix scorer validation errors before submitting.')
            return
        }

        setIsSubmitting(true)
        setErrorMessage(undefined)

        try {
            const tester = mode === 'create'
                ? await createTester({
                    className: className.trim(),
                    name: name.trim(),
                    sourceCode,
                    version: version.trim(),
                })
                : await createTesterVersion(existingTester?.id || '', {
                    className: className.trim(),
                    sourceCode,
                    version: version.trim(),
                })

            showSuccessToast('Scorer submitted - compiling...')
            onCreated(tester)
        } catch (error) {
            const nextErrorMessage = getErrorMessage(error, 'Failed to submit scorer')

            if (isMountedRef.current) {
                setErrorMessage(nextErrorMessage)
            }

            showErrorToast(nextErrorMessage)
        } finally {
            if (isMountedRef.current) {
                setIsSubmitting(false)
            }
        }
    }, [
        className,
        existingTester,
        hasValidationError,
        isSubmitting,
        mode,
        name,
        onCreated,
        sourceCode,
        version,
    ])

    const handleSubmitClick = useCallback((): void => {
        handleSubmit()
            .catch(() => undefined)
    }, [handleSubmit])

    useEffect(() => () => {
        isMountedRef.current = false
    }, [])

    if (mode === 'version' && !existingTester) {
        // eslint-disable-next-line unicorn/no-null
        return null
    }

    return (
        <>
            <BaseModal
                open
                onClose={handleModalClose}
                size='lg'
                title={mode === 'create'
                    ? 'New Scorer'
                    : `New Version for ${existingTester?.name}`}
                buttons={(
                    <div className={styles.modalActions}>
                        <Button
                            label='Cancel'
                            onClick={handleModalClose}
                            secondary
                        />
                        <Button
                            disabled={isSubmitting || hasValidationError}
                            label={isSubmitting
                                ? 'Submitting...'
                                : mode === 'create'
                                    ? 'Create Scorer'
                                    : 'Create Version'}
                            onClick={handleSubmitClick}
                            primary
                        />
                    </div>
                )}
            >
                <div className={styles.modalContent}>
                    {errorMessage
                        ? <div className={styles.error}>{errorMessage}</div>
                        : undefined}

                    <div className={styles.modalGrid}>
                        {mode === 'create'
                            ? (
                                <label className={styles.fieldGroup}>
                                    <span>Scorer Name</span>
                                    <input onChange={handleNameChange} type='text' value={name} />
                                    {validationErrors.name
                                        ? <small className={styles.fieldError}>{validationErrors.name}</small>
                                        : undefined}
                                </label>
                            )
                            : undefined}

                        <label className={styles.fieldGroup}>
                            <span>Version</span>
                            <input onChange={handleVersionChange} type='text' value={version} />
                            {validationErrors.version
                                ? <small className={styles.fieldError}>{validationErrors.version}</small>
                                : undefined}
                        </label>

                        <label className={styles.fieldGroup}>
                            <span>Class Name</span>
                            <input onChange={handleClassNameChange} type='text' value={className} />
                            {validationErrors.className
                                ? <small className={styles.fieldError}>{validationErrors.className}</small>
                                : undefined}
                        </label>
                    </div>

                    <label className={styles.fieldGroup}>
                        <span>Source Code</span>
                        <CodeMirror
                            basicSetup={SOURCE_EDITOR_SETUP}
                            className={styles.codeEditor}
                            extensions={SOURCE_EDITOR_EXTENSIONS}
                            height='320px'
                            indentWithTab
                            onChange={handleSourceCodeChange}
                            spellCheck={false}
                            theme='light'
                            value={sourceCode}
                        />
                        {validationErrors.sourceCode
                            ? <small className={styles.fieldError}>{validationErrors.sourceCode}</small>
                            : undefined}
                    </label>
                </div>
            </BaseModal>

            {showDiscardConfirmation
                ? (
                    <ConfirmationModal
                        cancelText='Keep Editing'
                        confirmText='Discard'
                        message='Discard the scorer changes in this modal?'
                        onCancel={handleDiscardCancel}
                        onConfirm={handleDiscardConfirm}
                        title='Discard scorer changes?'
                    />
                )
                : undefined}
        </>
    )
}

export default TesterModal
