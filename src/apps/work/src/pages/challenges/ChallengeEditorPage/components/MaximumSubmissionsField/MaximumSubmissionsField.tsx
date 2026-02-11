import {
    FC,
    useCallback,
    useEffect,
    useMemo,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import {
    FormCheckboxField,
    FormTextField,
} from '../../../../../lib/components/form'
import {
    ChallengeEditorFormData,
    ChallengeMetadata,
} from '../../../../../lib/models'
import {
    getMetadataValue,
    setMetadataValue,
} from '../../../../../lib/utils'

import styles from './MaximumSubmissionsField.module.scss'

const SUBMISSION_LIMIT_FIELD = 'submissionLimit'
const SUBMISSION_LIMIT_COUNT_FIELD = 'submissionLimitCount'
const SUBMISSION_LIMIT_FLAG_FIELD = 'submissionLimitEnabled'
const SUBMISSION_UNLIMITED_FLAG_FIELD = 'submissionLimitUnlimited'

interface SubmissionLimitMetadata {
    count: string
    limit: boolean
    unlimited: boolean
}

const emptySubmissionLimitMetadata: SubmissionLimitMetadata = {
    count: '',
    limit: false,
    unlimited: false,
}

function toBoolean(value: unknown): boolean {
    return value === true || value === 'true'
}

function parseSubmissionLimitMetadata(value: string | undefined): SubmissionLimitMetadata {
    if (!value) {
        return emptySubmissionLimitMetadata
    }

    try {
        const parsedValue = JSON.parse(value) as {
            count?: unknown
            limit?: unknown
            unlimited?: unknown
        }

        return {
            count: typeof parsedValue.count === 'string'
                ? parsedValue.count.replace(/[^\d]/g, '')
                : '',
            limit: toBoolean(parsedValue.limit),
            unlimited: toBoolean(parsedValue.unlimited),
        }
    } catch {
        return emptySubmissionLimitMetadata
    }
}

export const MaximumSubmissionsField: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const dynamicFormControl = formContext.control as any
    const metadata = useWatch({
        control: dynamicFormControl,
        name: 'metadata',
    }) as ChallengeMetadata[] | undefined
    const isUnlimited = useWatch({
        control: dynamicFormControl,
        name: SUBMISSION_UNLIMITED_FLAG_FIELD,
    }) as boolean | undefined
    const isLimitEnabled = useWatch({
        control: dynamicFormControl,
        name: SUBMISSION_LIMIT_FLAG_FIELD,
    }) as boolean | undefined
    const limitCount = useWatch({
        control: dynamicFormControl,
        name: SUBMISSION_LIMIT_COUNT_FIELD,
    }) as string | undefined

    const parsedSubmissionLimitMetadata = useMemo(
        () => parseSubmissionLimitMetadata(getMetadataValue(metadata, SUBMISSION_LIMIT_FIELD)),
        [metadata],
    )

    useEffect(() => {
        if (isUnlimited === undefined) {
            formContext.setValue(
                SUBMISSION_UNLIMITED_FLAG_FIELD as never,
                parsedSubmissionLimitMetadata.unlimited as never,
                {
                    shouldDirty: false,
                    shouldValidate: false,
                },
            )
        }

        if (isLimitEnabled === undefined) {
            formContext.setValue(
                SUBMISSION_LIMIT_FLAG_FIELD as never,
                parsedSubmissionLimitMetadata.limit as never,
                {
                    shouldDirty: false,
                    shouldValidate: false,
                },
            )
        }

        if (limitCount === undefined) {
            formContext.setValue(
                SUBMISSION_LIMIT_COUNT_FIELD as never,
                parsedSubmissionLimitMetadata.count as never,
                {
                    shouldDirty: false,
                    shouldValidate: false,
                },
            )
        }
    }, [
        formContext,
        isLimitEnabled,
        isUnlimited,
        limitCount,
        parsedSubmissionLimitMetadata.count,
        parsedSubmissionLimitMetadata.limit,
        parsedSubmissionLimitMetadata.unlimited,
    ])

    useEffect(() => {
        if (typeof isUnlimited !== 'boolean' || typeof isLimitEnabled !== 'boolean') {
            return
        }

        const submissionLimitPayload = JSON.stringify({
            count: isLimitEnabled
                ? (limitCount || '')
                : '',
            limit: isLimitEnabled
                ? 'true'
                : 'false',
            unlimited: isUnlimited
                ? 'true'
                : 'false',
        })

        if (getMetadataValue(metadata, SUBMISSION_LIMIT_FIELD) === submissionLimitPayload) {
            return
        }

        formContext.setValue(
            'metadata',
            setMetadataValue(
                metadata,
                SUBMISSION_LIMIT_FIELD,
                submissionLimitPayload,
            ),
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        )
    }, [
        formContext,
        isLimitEnabled,
        isUnlimited,
        limitCount,
        metadata,
    ])

    const handleUnlimitedChange = useCallback(
        (checked: boolean): void => {
            if (!checked) {
                return
            }

            formContext.setValue(
                SUBMISSION_LIMIT_FLAG_FIELD as never,
                false as never,
                {
                    shouldDirty: true,
                    shouldValidate: false,
                },
            )
            formContext.setValue(
                SUBMISSION_LIMIT_COUNT_FIELD as never,
                '' as never,
                {
                    shouldDirty: true,
                    shouldValidate: false,
                },
            )
        },
        [formContext],
    )

    const handleLimitChange = useCallback(
        (checked: boolean): void => {
            if (!checked) {
                return
            }

            formContext.setValue(
                SUBMISSION_UNLIMITED_FLAG_FIELD as never,
                false as never,
                {
                    shouldDirty: true,
                    shouldValidate: false,
                },
            )
        },
        [formContext],
    )

    const sanitizeLimitCount = useCallback(
        (value: string): string => value.replace(/[^\d]/g, ''),
        [],
    )

    return (
        <div className={styles.container}>
            <FormCheckboxField
                label='Unlimited'
                name={SUBMISSION_UNLIMITED_FLAG_FIELD}
                onChange={handleUnlimitedChange}
            />
            <FormCheckboxField
                label='Limit'
                name={SUBMISSION_LIMIT_FLAG_FIELD}
                onChange={handleLimitChange}
            />

            {isLimitEnabled
                ? (
                    <div className={styles.countField}>
                        <FormTextField
                            label='Limit Count'
                            name={SUBMISSION_LIMIT_COUNT_FIELD}
                            placeholder='Enter submission limit'
                            sanitize={sanitizeLimitCount}
                            type='number'
                        />
                    </div>
                )
                : undefined}
        </div>
    )
}

export default MaximumSubmissionsField
