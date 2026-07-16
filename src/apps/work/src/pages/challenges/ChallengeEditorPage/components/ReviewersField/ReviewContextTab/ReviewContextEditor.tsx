import { ChangeEvent, FC, KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'

import { Button, InputSelect, InputText, InputTextarea } from '~/libs/ui'
import { useAutosave, UseAutosaveResult } from '~/apps/work/src/lib/hooks'
import { updateChallengeReviewContext } from '~/apps/work/src/lib/services'
import { showErrorToast } from '~/apps/work/src/lib'
import { ConfirmationModal } from '~/apps/work/src/lib/components'
import {
    ChallengeReviewContext,
    ChallengeReviewContextData,
    ReviewContextConstraint,
    ReviewContextRequirement,
} from '~/apps/work/src/lib/models'

import ReviewContextRawEditor from './ReviewContextRawEditor'
import styles from './ReviewContextEditor.module.scss'

interface ReviewContextEditorProps {
    challengeId: string
    reviewContext: ChallengeReviewContext
    onContextSaved: () => Promise<unknown>
    isLocked?: boolean
}

interface RequirementValidationErrors {
    title?: string
    priority?: string
    description?: string
    constraints?: string
    constraintErrors: Record<string, string>
}

interface ReviewContextValidationResult {
    requirementsError?: string
    requirementErrors: Record<string, RequirementValidationErrors>
}

const PRIORITY_OPTIONS: {
 label: string;
 value: string;
}[] = [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
]

function createUniqueId(prefix = 'NEW'): string {
    return `${prefix}_${Math.random()
        .toString(36)
        .slice(2, 8)}`
}

function createRequirement(): ReviewContextRequirement {
    return {
        constraints: [],
        description: '',
        id: createUniqueId('REQ'),
        priority: 'medium',
        title: '',
    }
}

function createConstraint(text: string): ReviewContextConstraint {
    return {
        id: createUniqueId('CONSTR'),
        text,
    }
}

function validateReviewContext(
    context: ChallengeReviewContextData,
): ReviewContextValidationResult {
    const requirements = Array.isArray(context.requirements)
        ? context.requirements
        : []

    const requirementErrors: Record<string, RequirementValidationErrors> = {}

    requirements.forEach(requirement => {
        const errors: RequirementValidationErrors = {
            constraintErrors: {},
        }

        if (requirement.title.trim().length < 3) {
            errors.title = 'Title is required and must be at least 3 characters.'
        }

        if (requirement.description.trim().length < 10) {
            errors.description = 'Description is required and must be at least 10 characters.'
        }

        if (!['high', 'medium', 'low'].includes(requirement.priority)) {
            errors.priority = 'Priority must be high, medium, or low.'
        }

        if (!Array.isArray(requirement.constraints) || requirement.constraints.length === 0) {
            errors.constraints = 'Add at least one constraint.'
        }

        requirement.constraints?.forEach(constraint => {
            if (constraint.text.trim().length < 5) {
                errors.constraintErrors[constraint.id] = 'Constraint must be at least 5 characters.'
            }
        })

        if (
            Object.keys(errors.constraintErrors).length > 0
            && !errors.constraints
        ) {
            errors.constraints = 'Fix invalid constraints.'
        }

        if (
            errors.title
            || errors.description
            || errors.priority
            || errors.constraints
            || Object.keys(errors.constraintErrors).length > 0
        ) {
            requirementErrors[requirement.id] = errors
        }
    })

    return {
        requirementErrors,
        requirementsError: requirements.length === 0
            ? 'Add at least one requirement.'
            : undefined,
    }
}

const ReviewContextEditor: FC<ReviewContextEditorProps> = props => {
    const [context, setContext] = useState<ChallengeReviewContextData>(props.reviewContext.context)
    const [saveError, setSaveError] = useState<string | undefined>()
    const [focusRequirementId, setFocusRequirementId] = useState<string | undefined>()
    const [pendingRemoveRequirement, setPendingRemoveRequirement] = useState<{
        id: string
        title: string
    } | undefined>(undefined)
    const [pendingRemoveConstraint, setPendingRemoveConstraint] = useState<{
        requirementId: string
        constraintId: string
    } | undefined>(undefined)
    const [constraintDrafts, setConstraintDrafts] = useState<Record<string, string>>({})
    const [draftErrors, setDraftErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        setContext(props.reviewContext.context)
    }, [props.reviewContext.context])

    const validation = useMemo(
        () => validateReviewContext(context),
        [context],
    )

    const hasValidationErrors = Boolean(
        validation.requirementsError
        || Object.keys(validation.requirementErrors).length > 0,
    )

    const saveReviewContext = useCallback(async (values: ChallengeReviewContextData): Promise<void> => {
        if (props.isLocked) {
            return
        }

        setSaveError(undefined)

        try {
            await updateChallengeReviewContext(props.challengeId, {
                context: values,
                status: props.reviewContext.status,
            })

            await props.onContextSaved()
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to save review context.'

            setSaveError(message)
            showErrorToast(message)
            throw error
        }
    }, [props.challengeId, props.onContextSaved, props.reviewContext.status])

    const { saveStatus }: UseAutosaveResult = useAutosave<ChallengeReviewContextData>({
        delay: 500,
        enabled: !hasValidationErrors && !props.isLocked,
        formValues: context,
        onSave: saveReviewContext,
    })

    useEffect(() => {
        if (!focusRequirementId) {
            return
        }

        const input = document.querySelector<HTMLInputElement>(
            `input[name="requirement-${focusRequirementId}-title"]`,
        )

        input?.focus()
        setFocusRequirementId(undefined)
    }, [focusRequirementId])

    const handleRequirementFieldChange = useCallback(
        (
            requirementId: string,
            field: keyof Omit<ReviewContextRequirement, 'id' | 'constraints'>,
            value: string,
        ): void => {
            setSaveError(undefined)
            setContext(prev => ({
                ...prev,
                requirements: (prev.requirements ?? []).map(requirement => (
                    requirement.id === requirementId
                        ? { ...requirement, [field]: value }
                        : requirement
                )),
            }))
        },
        [],
    )

    const handleAddRequirement = useCallback((): void => {
        const requirement = createRequirement()

        setSaveError(undefined)
        setContext(prev => ({
            ...prev,
            requirements: [
                ...(prev.requirements ?? []),
                requirement,
            ],
        }))
        setFocusRequirementId(requirement.id)
    }, [])

    const handleRemoveRequirement = useCallback((): void => {
        if (!pendingRemoveRequirement) {
            return
        }

        setSaveError(undefined)
        setContext(prev => ({
            ...prev,
            requirements: (prev.requirements ?? []).filter(
                requirement => requirement.id !== pendingRemoveRequirement.id,
            ),
        }))

        setPendingRemoveRequirement(undefined)
    }, [pendingRemoveRequirement])

    const handleAddConstraintDraft = useCallback((requirementId: string): void => {
        setConstraintDrafts(prev => ({
            ...prev,
            [requirementId]: '',
        }))

        setDraftErrors(prev => {
            const next = { ...prev }
            delete next[requirementId]
            return next
        })
    }, [])

    const saveConstraintDraft = useCallback((requirementId: string): void => {
        const text = (constraintDrafts[requirementId] ?? '').trim()

        if (text.length < 5) {
            setDraftErrors(prev => ({
                ...prev,
                [requirementId]: 'Constraint must be at least 5 characters.',
            }))
            return
        }

        setSaveError(undefined)
        setContext(prev => ({
            ...prev,
            requirements: (prev.requirements ?? []).map(requirement => (
                requirement.id !== requirementId
                    ? requirement
                    : {
                        ...requirement,
                        constraints: [
                            ...requirement.constraints,
                            createConstraint(text),
                        ],
                    }
            )),
        }))

        setConstraintDrafts(prev => {
            const next = { ...prev }
            delete next[requirementId]
            return next
        })

        setDraftErrors(prev => {
            const next = { ...prev }
            delete next[requirementId]
            return next
        })
    }, [constraintDrafts])

    const cancelConstraintDraft = useCallback((requirementId: string): void => {
        setConstraintDrafts(prev => {
            const next = { ...prev }
            delete next[requirementId]
            return next
        })

        setDraftErrors(prev => {
            const next = { ...prev }
            delete next[requirementId]
            return next
        })
    }, [])

    const handleConstraintDraftKeyDown = useCallback(
        (requirementId: string, event: KeyboardEvent<HTMLInputElement>): void => {
            if (event.key === 'Enter') {
                event.preventDefault()
                saveConstraintDraft(requirementId)
                return
            }

            if (event.key === 'Escape') {
                event.preventDefault()
                cancelConstraintDraft(requirementId)
            }
        },
        [cancelConstraintDraft, saveConstraintDraft],
    )

    const handleRemoveConstraint = useCallback((): void => {
        if (!pendingRemoveConstraint) {
            return
        }

        setSaveError(undefined)
        setContext(prev => ({
            ...prev,
            requirements: (prev.requirements ?? []).map(requirement => (
                requirement.id !== pendingRemoveConstraint.requirementId
                    ? requirement
                    : {
                        ...requirement,
                        constraints: requirement.constraints.filter(
                            constraint => constraint.id !== pendingRemoveConstraint.constraintId,
                        ),
                    }
            )),
        }))

        setPendingRemoveConstraint(undefined)
    }, [pendingRemoveConstraint])

    const showSaveStatus = useMemo(() => {
        if (saveStatus === 'saving') {
            return 'Saving...'
        }

        if (saveStatus === 'saved') {
            return '✓ All changes saved'
        }

        if (saveStatus === 'error') {
            return saveError ?? 'Failed to save changes.'
        }

        return hasValidationErrors
            ? 'Resolve validation errors to auto-save.'
            : 'Auto-save enabled'
    }, [hasValidationErrors, saveError, saveStatus])

    const requirements = Array.isArray(context.requirements)
        ? context.requirements
        : []

    return (
        <div className={styles.wrap}>
            {props.isLocked && (
                <div className={styles.infoBanner}>
                    Review context is locked because this challenge already has submissions.
                </div>
            )}
            <div className={styles.toolbar}>
                <div className={styles.statusBlock}>
                    <div className={styles.statusText}>{showSaveStatus}</div>
                    {saveError && <div className={styles.saveError}>{saveError}</div>}
                    {validation.requirementsError && (
                        <div className={styles.validationMessage}>
                            {validation.requirementsError}
                        </div>
                    )}
                </div>
                {!props.isLocked && (
                    <Button
                        label='+ Add Requirement'
                        onClick={handleAddRequirement}
                        secondary
                        size='lg'
                    />
                )}
            </div>

            {requirements.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No requirements defined yet. Use the button above to add one.</p>
                </div>
            )}

            <div className={styles.requirements}>
                {requirements.map((requirement, index) => {
                    const requirementErrors = validation.requirementErrors[requirement.id]
                    const draftText = constraintDrafts[requirement.id]
                    const draftError = draftErrors[requirement.id]

                    return (
                        <div className={styles.requirementCard} key={requirement.id}>
                            <div className={styles.requirementHeader}>
                                <div className={styles.requirementHeaderText}>
                                    Requirement
                                    {' '}
                                    {index + 1}
                                </div>
                                {!props.isLocked && (
                                    <Button
                                        label='Remove'
                                        onClick={() => setPendingRemoveRequirement({
                                            id: requirement.id,
                                            title: requirement.title,
                                        })}
                                        secondary
                                        size='sm'
                                        variant='danger'
                                    />
                                )}
                            </div>

                            <div className={styles.fieldRow}>
                                <InputText
                                    label='Title*'
                                    name={`requirement-${requirement.id}-title`}
                                    type='text'
                                    value={requirement.title}
                                    disabled={props.isLocked}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => handleRequirementFieldChange(
                                        requirement.id,
                                        'title',
                                        event.target.value,
                                    )}
                                    error={requirementErrors?.title}
                                    dirty
                                    placeholder='Code Quality Standards'
                                />
                            </div>

                            <div className={classNames(styles.fieldRow, styles.twoColumn)}>
                                <InputSelect
                                    label='Priority*'
                                    name={`requirement-${requirement.id}-priority`}
                                    options={PRIORITY_OPTIONS}
                                    value={requirement.priority}
                                    disabled={props.isLocked}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => handleRequirementFieldChange(
                                        requirement.id,
                                        'priority',
                                        event.target.value,
                                    )}
                                    error={requirementErrors?.priority}
                                    placeholder='Select priority'
                                />
                            </div>

                            <div className={styles.fieldRow}>
                                <InputTextarea
                                    label='Description*'
                                    name={`requirement-${requirement.id}-description`}
                                    value={requirement.description}
                                    disabled={props.isLocked}
                                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => handleRequirementFieldChange(
                                        requirement.id,
                                        'description',
                                        event.target.value,
                                    )}
                                    rows={5}
                                    error={requirementErrors?.description}
                                    placeholder='Describe the requirement in detail.'
                                />
                            </div>

                            <div className={styles.constraintsSection}>
                                <div className={styles.constraintsHeader}>
                                    <div>CONSTRAINTS</div>
                                    {!props.isLocked && (
                                        <Button
                                            label='+ Add Constraint'
                                            onClick={() => handleAddConstraintDraft(requirement.id)}
                                            secondary
                                            size='sm'
                                        />
                                    )}
                                </div>

                                <div className={styles.constraintList}>
                                    {requirement.constraints.map(constraint => (
                                        <div
                                            key={constraint.id}
                                            className={classNames(
                                                styles.constraintItem,
                                                requirementErrors?.constraintErrors?.[constraint.id]
                                                    ? styles.constraintItemInvalid
                                                    : undefined,
                                            )}
                                        >
                                            <span className={styles.constraintText}>
                                                {constraint.text}
                                            </span>
                                            {!props.isLocked && (
                                                <Button
                                                    label='🗑️'
                                                    onClick={() => setPendingRemoveConstraint({
                                                        constraintId: constraint.id,
                                                        requirementId: requirement.id,
                                                    })}
                                                    secondary
                                                    size='sm'
                                                    variant='danger'
                                                />
                                            )}
                                            {requirementErrors?.constraintErrors?.[constraint.id] && (
                                                <div className={styles.fieldError}>
                                                    {requirementErrors.constraintErrors[constraint.id]}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {!props.isLocked && draftText !== undefined && (
                                        <div className={styles.constraintDraft}>
                                            <input
                                                className={classNames(
                                                    styles.constraintDraftInput,
                                                    draftError ? styles.constraintDraftInputError : undefined,
                                                )}
                                                placeholder='Enter a new constraint'
                                                value={draftText}
                                                onChange={(event: ChangeEvent<HTMLInputElement>) => setConstraintDrafts(prev => ({
                                                    ...prev,
                                                    [requirement.id]: event.target.value,
                                                }))}
                                                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => handleConstraintDraftKeyDown(requirement.id, event)}
                                                autoFocus
                                            />
                                            <div className={styles.constraintDraftHint}>
                                                Press Enter to save, Esc to cancel.
                                            </div>
                                            {draftError && (
                                                <div className={styles.fieldError}>{draftError}</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {requirementErrors?.constraints && (
                                    <div className={styles.fieldError}>
                                        {requirementErrors.constraints}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <ReviewContextRawEditor context={context} />

            {pendingRemoveRequirement && (
                <ConfirmationModal
                    title={`Remove requirement '${pendingRemoveRequirement.title || 'Untitled'}'?`}
                    message={`Remove requirement '${pendingRemoveRequirement.title || 'Untitled'}'? This cannot be undone.`}
                    onCancel={() => setPendingRemoveRequirement(undefined)}
                    onConfirm={handleRemoveRequirement}
                    confirmButtonDanger
                    confirmText='Remove'
                />
            )}

            {pendingRemoveConstraint && (
                <ConfirmationModal
                    title='Remove constraint'
                    message='Remove this constraint?'
                    onCancel={() => setPendingRemoveConstraint(undefined)}
                    onConfirm={handleRemoveConstraint}
                    confirmButtonDanger
                    confirmText='Remove'
                />
            )}
        </div>
    )
}

export default ReviewContextEditor
