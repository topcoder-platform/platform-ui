import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import hljs from 'highlight.js/lib/core'
import javaLanguage from 'highlight.js/lib/languages/java'
import 'highlight.js/styles/github.css'

import {
    BaseModal,
    Button,
} from '~/libs/ui'

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

if (!hljs.getLanguage('java')) {
    hljs.registerLanguage('java', javaLanguage)
}

const PREVIEW_DEBOUNCE_MS = 300

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

function highlightJavaCode(sourceCode: string): string {
    if (!sourceCode.trim()) {
        return ''
    }

    return hljs.highlight(sourceCode, {
        language: 'java',
    }).value
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
    const [previewHtml, setPreviewHtml] = useState<string>(highlightJavaCode(initialSourceCode))
    const [errorMessage, setErrorMessage] = useState<string | undefined>()
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [showDiscardConfirmation, setShowDiscardConfirmation] = useState<boolean>(false)

    const validationErrors = useMemo((): ValidationErrors => {
        const errors: ValidationErrors = {}
        const comparisonVersion = maxExistingVersion?.trim() || existingTester?.version?.trim()

        if (mode === 'create' && !name.trim()) {
            errors.name = 'Tester name is required.'
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
    const lineNumbers = useMemo(
        (): number[] => Array.from({
            length: Math.max(sourceCode.split('\n').length, 1),
        }, (_, index) => index + 1),
        [sourceCode],
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

    const handleSourceCodeChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>): void => {
        setSourceCode(event.target.value)
    }, [])

    const handleSourceCodeBlur = useCallback((): void => {
        setPreviewHtml(highlightJavaCode(sourceCode))
    }, [sourceCode])

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
            setErrorMessage('Please fix tester validation errors before submitting.')
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

            showSuccessToast('Tester submitted - compiling...')
            onCreated(tester)
        } catch (error) {
            const nextErrorMessage = getErrorMessage(error, 'Failed to submit tester')

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

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setPreviewHtml(highlightJavaCode(sourceCode))
        }, PREVIEW_DEBOUNCE_MS)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [sourceCode])

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
                    ? 'New Tester'
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
                                    ? 'Create Tester'
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
                                    <span>Tester Name</span>
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
                        <div className={styles.sourceEditorShell}>
                            <div className={styles.lineNumbers}>
                                {lineNumbers.map(lineNumber => (
                                    <div key={lineNumber}>{lineNumber}</div>
                                ))}
                            </div>
                            <textarea
                                className={styles.sourceEditor}
                                onBlur={handleSourceCodeBlur}
                                onChange={handleSourceCodeChange}
                                spellCheck={false}
                                value={sourceCode}
                            />
                        </div>
                        {validationErrors.sourceCode
                            ? <small className={styles.fieldError}>{validationErrors.sourceCode}</small>
                            : undefined}
                    </label>

                    <div className={styles.previewPanel}>
                        <div className={styles.previewHeader}>Java Preview</div>
                        <pre
                            className={styles.codePreview}
                            dangerouslySetInnerHTML={{
                                __html: previewHtml || '&nbsp;',
                            }}
                        />
                    </div>
                </div>
            </BaseModal>

            {showDiscardConfirmation
                ? (
                    <ConfirmationModal
                        cancelText='Keep Editing'
                        confirmText='Discard'
                        message='Discard the tester changes in this modal?'
                        onCancel={handleDiscardCancel}
                        onConfirm={handleDiscardConfirm}
                        title='Discard tester changes?'
                    />
                )
                : undefined}
        </>
    )
}

export default TesterModal
