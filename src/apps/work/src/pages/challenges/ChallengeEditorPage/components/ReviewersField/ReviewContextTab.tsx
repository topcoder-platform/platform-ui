import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import { Button } from '~/libs/ui'

import {
    createChallengeReviewContext,
    fetchChallengeReviewContextByChallenge,
    generateChallengeReviewContext,
    updateChallengeReviewContext,
} from '../../../../../lib/services'
import {
    ChallengeReviewContextStatus,
} from '../../../../../lib/models'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../../../lib/utils'
import styles from './ReviewersField.module.scss'

interface ReviewContextTabProps {
    challengeId?: string
    challengeName?: string
    challengeDescription?: string
}

type ContextFieldRow = {
    key: string
    value: string
}

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(item => item)
}

function parseJsonValue(value: string): unknown {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
        return ''
    }

    if (trimmedValue === 'true') {
        return true
    }

    if (trimmedValue === 'false') {
        return false
    }

    if (trimmedValue === 'null') {
        return null
    }

    if (!Number.isNaN(Number(trimmedValue)) && trimmedValue !== '') {
        const numberValue = Number(trimmedValue)

        if (String(numberValue) === trimmedValue || trimmedValue.startsWith('0')) {
            return numberValue
        }
    }

    if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
        try {
            return JSON.parse(trimmedValue)
        } catch {
            return trimmedValue
        }
    }

    return trimmedValue
}

function buildJsonValue(value: unknown): string {
    if (typeof value === 'string') {
        return value
    }

    try {
        return JSON.stringify(value, null, 2)
    } catch {
        return String(value)
    }
}

function buildContextFields(
    context: Record<string, unknown>,
): ContextFieldRow[] {
    return Object.entries(context)
        .filter(([key]) => key !== 'requirements' && key !== 'constraints')
        .map(([key, value]) => ({
            key,
            value: buildJsonValue(value),
        }))
}

function buildContextFromState(
    fields: ContextFieldRow[],
    requirements: string[],
    constraints: string[],
): Record<string, unknown> {
    const context: Record<string, unknown> = {}

    fields.forEach(field => {
        const key = field.key.trim()

        if (!key) {
            return
        }

        context[key] = parseJsonValue(field.value)
    })

    if (requirements.length > 0) {
        context.requirements = requirements
    }

    if (constraints.length > 0) {
        context.constraints = constraints
    }

    return context
}

export const ReviewContextTab: FC<ReviewContextTabProps> = (
    props: ReviewContextTabProps,
) => {
    const {
        challengeId,
        challengeName,
        challengeDescription,
    } = props
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isRawView, setIsRawView] = useState(false)
    const [hasLoadedContext, setHasLoadedContext] = useState(false)
    const [requirements, setRequirements] = useState<string[]>([])
    const [constraints, setConstraints] = useState<string[]>([])
    const [fields, setFields] = useState<ContextFieldRow[]>([])
    const [rawJson, setRawJson] = useState<string>('{}')
    const [saveError, setSaveError] = useState<string | undefined>()
    const [jsonError, setJsonError] = useState<string | undefined>()
    const [fetchError, setFetchError] = useState<string | undefined>()
    const [isDirty, setIsDirty] = useState(false)

    const hasContext = useMemo(
        () => fields.length > 0
            || requirements.length > 0
            || constraints.length > 0,
        [constraints.length, fields.length, requirements.length],
    )

    const loadContext = useCallback(async (): Promise<void> => {
        if (!challengeId) {
            setHasLoadedContext(true)
            return
        }

        setIsLoading(true)
        setFetchError(undefined)

        try {
            const existingContext = await fetchChallengeReviewContextByChallenge(challengeId)

            if (existingContext?.context) {
                setRequirements(normalizeStringArray(existingContext.context.requirements))
                setConstraints(normalizeStringArray(existingContext.context.constraints))
                setFields(buildContextFields(existingContext.context))
                setRawJson(JSON.stringify(existingContext.context, null, 2))
            } else {
                setRequirements([])
                setConstraints([])
                setFields([])
                setRawJson('{}')
            }
        } catch (error) {
            setFetchError(error instanceof Error ? error.message : 'Failed to load review context')
        } finally {
            setHasLoadedContext(true)
            setIsLoading(false)
            setIsDirty(false)
        }
    }, [challengeId])

    useEffect(() => {
        if (!hasLoadedContext) {
            void loadContext()
        }
    }, [hasLoadedContext, loadContext])

    const setContextState = useCallback(
        (context: Record<string, unknown> | undefined): void => {
            if (!context) {
                setRequirements([])
                setConstraints([])
                setFields([])
                setRawJson('{}')

                return
            }

            setRequirements(normalizeStringArray(context.requirements))
            setConstraints(normalizeStringArray(context.constraints))
            setFields(buildContextFields(context))
            setRawJson(JSON.stringify(context, null, 2))
        },
        [],
    )

    const handleGenerateClick = useCallback(async (): Promise<void> => {
        if (!challengeId) {
            showErrorToast('Please save the challenge before generating review context.')
            return
        }

        setIsSaving(true)
        setSaveError(undefined)

        try {
            const generatedContext = await generateChallengeReviewContext(
                challengeId || '',
                challengeDescription || '',
            )

            const response = await createChallengeReviewContext({
                challengeId,
                context: generatedContext,
                status: 'AI_GENERATED',
            })

            setContextState(response.context)
            setIsRawView(false)
            setIsDirty(false)
            showSuccessToast('Review context generated successfully.')
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to generate review context.'

            setSaveError(message)
            showErrorToast(message)
        } finally {
            setIsSaving(false)
        }
    }, [challengeDescription, challengeId, challengeName, setContextState])

    const handleSaveClick = useCallback(async (): Promise<void> => {
        if (!challengeId) {
            showErrorToast('Please save the challenge before saving review context.')
            return
        }

        setIsSaving(true)
        setSaveError(undefined)

        try {
            let payloadContext: Record<string, unknown>

            if (isRawView) {
                const parsed = JSON.parse(rawJson)

                if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                    throw new Error('Review context must be a JSON object.')
                }

                payloadContext = parsed
            } else {
                payloadContext = buildContextFromState(fields, requirements, constraints)
            }

            const response = await updateChallengeReviewContext(challengeId, {
                context: payloadContext,
            }).catch(async (error) => {
                const typedError = error as { response?: { status?: number } }
                const status = typedError?.response?.status

                if (status === 404) {
                    return await createChallengeReviewContext({
                        challengeId,
                        context: payloadContext,
                        status: 'AI_GENERATED',
                    })
                }

                throw error
            })

            setContextState(response.context)
            setIsDirty(false)
            setIsRawView(false)
            showSuccessToast('Review context saved successfully.')
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to save review context.'

            setSaveError(message)
            showErrorToast(message)
        } finally {
            setIsSaving(false)
        }
    }, [challengeId, constraints, createChallengeReviewContext, fields, isRawView, rawJson, requirements, setContextState])

    const handleRawToggle = useCallback((): void => {
        if (isRawView) {
            try {
                const parsed = JSON.parse(rawJson)

                if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                    throw new Error('Review context must be a JSON object.')
                }

                setContextState(parsed)
                setJsonError(undefined)
                setIsRawView(false)
            } catch (error) {
                setJsonError(error instanceof Error ? error.message : 'Invalid JSON.')
            }

            return
        }

        setRawJson(JSON.stringify(buildContextFromState(fields, requirements, constraints), null, 2))
        setIsRawView(true)
        setJsonError(undefined)
    }, [constraints, fields, isRawView, rawJson, requirements, setContextState])

    const handleFieldChange = useCallback(
        (index: number, key: string, value: string): void => {
            setFields(prevFields => prevFields.map((field, fieldIndex) => (
                fieldIndex === index
                    ? { key, value }
                    : field
            )))
            setIsDirty(true)
        },
        [],
    )

    const handleRemoveField = useCallback((index: number): void => {
        setFields(prevFields => prevFields.filter((_, fieldIndex) => fieldIndex !== index))
        setIsDirty(true)
    }, [])

    const handleAddField = useCallback((): void => {
        setFields(prevFields => [
            ...prevFields,
            { key: '', value: '' },
        ])
        setIsDirty(true)
    }, [])

    const handleRequirementChange = useCallback((index: number, value: string): void => {
        setRequirements(prev => prev.map((item, itemIndex) => (
            itemIndex === index ? value : item
        )))
        setIsDirty(true)
    }, [])

    const handleAddRequirement = useCallback((): void => {
        setRequirements(prev => [...prev, ''])
        setIsDirty(true)
    }, [])

    const handleRemoveRequirement = useCallback((index: number): void => {
        setRequirements(prev => prev.filter((_, itemIndex) => itemIndex !== index))
        setIsDirty(true)
    }, [])

    const handleConstraintChange = useCallback((index: number, value: string): void => {
        setConstraints(prev => prev.map((item, itemIndex) => (
            itemIndex === index ? value : item
        )))
        setIsDirty(true)
    }, [])

    const handleAddConstraint = useCallback((): void => {
        setConstraints(prev => [...prev, ''])
        setIsDirty(true)
    }, [])

    const handleRemoveConstraint = useCallback((index: number): void => {
        setConstraints(prev => prev.filter((_, itemIndex) => itemIndex !== index))
        setIsDirty(true)
    }, [])

    const handleRawJsonChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>): void => {
            setRawJson(event.target.value)
            setJsonError(undefined)
            setIsDirty(true)
        },
        [],
    )

    const descriptionText = useMemo(() => {
        if (!challengeId) {
            return 'Save the challenge before generating review context.'
        }

        if (fetchError) {
            return fetchError
        }

        if (hasLoadedContext && !hasContext) {
            return 'No review context defined for this challenge.'
        }

        return undefined
    }, [challengeId, fetchError, hasContext, hasLoadedContext])

    return (
        <div className={styles.reviewContextContainer} data-testid='review-context-tab'>
            {isLoading
                ? (
                    <div className={styles.reviewContextLoading}>
                        Loading review context...
                    </div>
                )
                : descriptionText && !hasContext
                    ? (
                        <div className={styles.reviewContextEmptyState}>
                            <div className={styles.reviewContextEmptyIcon}>📋</div>
                            <h3>Review context requirements</h3>
                            <p>
                                Define the evaluation criteria for AI-powered requirements review.
                            </p>
                            <p>{descriptionText}</p>
                            <Button
                                disabled={!challengeId || isSaving}
                                label={isSaving ? 'Generating context...' : 'Generate Challenge Review Context'}
                                onClick={handleGenerateClick}
                                size='lg'
                            />
                        </div>
                    )
                    : (
                        <div className={styles.reviewContextEditor}>
                            <div className={styles.reviewContextActions}>
                                <Button
                                    label={isRawView ? 'Switch to structured view' : 'View raw JSON'}
                                    onClick={handleRawToggle}
                                    secondary
                                    size='sm'
                                />
                                <Button
                                    disabled={!isDirty || isSaving}
                                    label={isSaving ? 'Saving...' : 'Save changes'}
                                    onClick={handleSaveClick}
                                    size='sm'
                                />
                            </div>
                            {saveError && (
                                <div className={styles.reviewContextError}>{saveError}</div>
                            )}
                            {jsonError && (
                                <div className={styles.reviewContextError}>{jsonError}</div>
                            )}
                            {isRawView
                                ? (
                                    <textarea
                                        aria-label='Review context JSON editor'
                                        className={styles.reviewContextJsonTextarea}
                                        value={rawJson}
                                        onChange={handleRawJsonChange}
                                    />
                                )
                                : (
                                    <div className={styles.reviewContextStructured}>
                                        <div className={styles.reviewContextSection}>
                                            <div className={styles.reviewContextSectionHeader}>
                                                <h4>Requirements</h4>
                                                <Button
                                                    label='Add requirement'
                                                    onClick={handleAddRequirement}
                                                    secondary
                                                    size='sm'
                                                />
                                            </div>
                                            {requirements.length === 0
                                                ? <div className={styles.reviewContextEmptySection}>No requirements configured.</div>
                                                : requirements.map((requirement, index) => (
                                                    <div
                                                        className={styles.reviewContextArrayItem}
                                                        key={`requirement-${index}`}
                                                    >
                                                        <input
                                                            className={styles.reviewContextArrayInput}
                                                            value={requirement}
                                                            onChange={event => handleRequirementChange(index, event.target.value)}
                                                        />
                                                        <Button
                                                            label='Remove'
                                                            onClick={() => handleRemoveRequirement(index)}
                                                            secondary
                                                            size='sm'
                                                        />
                                                    </div>
                                                ))}
                                        </div>

                                        <div className={styles.reviewContextSection}>
                                            <div className={styles.reviewContextSectionHeader}>
                                                <h4>Constraints</h4>
                                                <Button
                                                    label='Add constraint'
                                                    onClick={handleAddConstraint}
                                                    secondary
                                                    size='sm'
                                                />
                                            </div>
                                            {constraints.length === 0
                                                ? <div className={styles.reviewContextEmptySection}>No constraints configured.</div>
                                                : constraints.map((constraint, index) => (
                                                    <div
                                                        className={styles.reviewContextArrayItem}
                                                        key={`constraint-${index}`}
                                                    >
                                                        <input
                                                            className={styles.reviewContextArrayInput}
                                                            value={constraint}
                                                            onChange={event => handleConstraintChange(index, event.target.value)}
                                                        />
                                                        <Button
                                                            label='Remove'
                                                            onClick={() => handleRemoveConstraint(index)}
                                                            secondary
                                                            size='sm'
                                                        />
                                                    </div>
                                                ))}
                                        </div>

                                        <div className={styles.reviewContextSection}>
                                            <div className={styles.reviewContextSectionHeader}>
                                                <h4>Additional fields</h4>
                                                <Button
                                                    label='Add field'
                                                    onClick={handleAddField}
                                                    secondary
                                                    size='sm'
                                                />
                                            </div>
                                            {fields.length === 0
                                                ? <div className={styles.reviewContextEmptySection}>No additional fields configured.</div>
                                                : fields.map((field, index) => (
                                                    <div
                                                        className={styles.reviewContextFieldRow}
                                                        key={`field-${index}`}
                                                    >
                                                        <input
                                                            aria-label='Field name'
                                                            className={styles.reviewContextFieldKey}
                                                            placeholder='Field name'
                                                            value={field.key}
                                                            onChange={event => handleFieldChange(index, event.target.value, field.value)}
                                                        />
                                                        <textarea
                                                            aria-label='Field value'
                                                            className={styles.reviewContextFieldValue}
                                                            placeholder='JSON value or text'
                                                            value={field.value}
                                                            onChange={event => handleFieldChange(index, field.key, event.target.value)}
                                                        />
                                                        <Button
                                                            label='Remove'
                                                            onClick={() => handleRemoveField(index)}
                                                            secondary
                                                            size='sm'
                                                        />
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
        </div>
    )
}
