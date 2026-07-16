import type {
    ChangeEvent,
    FC,
} from 'react'

import { Button } from '~/libs/ui'
import type { ContextFieldRow } from './ReviewContextTab'
import styles from './ReviewersField.module.scss'

export interface ReviewContextEditorProps {
    isRawView: boolean
    rawJson: string
    saveError?: string
    jsonError?: string
    isSaving: boolean
    isDirty: boolean
    hasContext: boolean
    descriptionText?: string
    fields: ContextFieldRow[]
    requirements: string[]
    constraints: string[]
    handleGenerateClick: () => Promise<void>
    handleSaveClick: () => Promise<void>
    handleRawToggle: () => void
    handleFieldChange: (index: number, key: string, value: string) => void
    handleRemoveField: (index: number) => void
    handleAddField: () => void
    handleRequirementChange: (index: number, value: string) => void
    handleAddRequirement: () => void
    handleRemoveRequirement: (index: number) => void
    handleConstraintChange: (index: number, value: string) => void
    handleAddConstraint: () => void
    handleRemoveConstraint: (index: number) => void
    handleRawJsonChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
}

const ReviewContextEditor: FC<ReviewContextEditorProps> = ({
    isRawView,
    rawJson,
    saveError,
    jsonError,
    isSaving,
    isDirty,
    hasContext,
    descriptionText,
    fields,
    requirements,
    constraints,
    handleGenerateClick,
    handleSaveClick,
    handleRawToggle,
    handleFieldChange,
    handleRemoveField,
    handleAddField,
    handleRequirementChange,
    handleAddRequirement,
    handleRemoveRequirement,
    handleConstraintChange,
    handleAddConstraint,
    handleRemoveConstraint,
    handleRawJsonChange,
}) => (
    <div className={styles.reviewContextContainer} data-testid='review-context-tab'>
        {descriptionText && !hasContext
            ? (
                <div className={styles.reviewContextEmptyState}>
                    <div className={styles.reviewContextEmptyIcon}>📋</div>
                    <h3>Review context requirements</h3>
                    <p>
                        Define the evaluation criteria for AI-powered requirements review.
                    </p>
                    <p>{descriptionText}</p>
                    <Button
                        disabled={isSaving}
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

export default ReviewContextEditor
