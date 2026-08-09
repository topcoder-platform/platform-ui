import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import {
    FormRadioGroup,
    FormRadioOption,
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
const SUBMISSION_LIMIT_MODE_FIELD = 'submissionLimitMode'
const LIMITED_MODE = 'limited'
const UNLIMITED_MODE = 'unlimited'

type SubmissionLimitMode = typeof LIMITED_MODE | typeof UNLIMITED_MODE

interface SubmissionLimitMetadata {
    count: string
    mode: SubmissionLimitMode
}

const submissionLimitOptions: FormRadioOption<string>[] = [
    {
        label: 'Unlimited',
        value: UNLIMITED_MODE,
    },
    {
        label: 'Limited',
        value: LIMITED_MODE,
    },
]

const defaultSubmissionLimitMetadata: SubmissionLimitMetadata = {
    count: '',
    mode: UNLIMITED_MODE,
}

interface MaximumSubmissionsFieldProps {
    /**
     * Defers dirtying the form while the editor is still restoring persisted assignments.
     * Once hydration finishes, newly defaulted metadata is marked dirty so save/autosave
     * persists the canonical unlimited payload.
     */
    deferDirty?: boolean
}

/**
 * Converts legacy string and boolean flags to a strict boolean.
 *
 * @param value legacy metadata flag.
 * @returns Whether the flag is enabled.
 * @throws Does not throw.
 */
function toBoolean(value: unknown): boolean {
    return value === true || value === 'true'
}

/**
 * Removes non-numeric characters from a submission-limit count.
 *
 * @param value raw form or metadata value.
 * @returns The digits-only submission count.
 * @throws Does not throw.
 */
function sanitizeSubmissionLimitCount(value: string): string {
    return value.replace(/[^\d]/g, '')
}

/**
 * Parses the legacy JSON string stored in `submissionLimit` challenge metadata.
 *
 * Missing, malformed, and explicitly non-limited values use the product default of unlimited.
 * A positive count without either flag is retained for compatibility with older payloads.
 *
 * @param value serialized challenge metadata value.
 * @returns The submission-limit mode and sanitized count used by the form.
 * @throws Does not throw; malformed metadata falls back to unlimited.
 */
function parseSubmissionLimitMetadata(value: string | undefined): SubmissionLimitMetadata {
    if (!value) {
        return defaultSubmissionLimitMetadata
    }

    try {
        const parsedValue = JSON.parse(value) as unknown

        if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
            return defaultSubmissionLimitMetadata
        }

        const parsedMetadata = parsedValue as Record<string, unknown>
        const rawCount = typeof parsedMetadata.count === 'string'
            || typeof parsedMetadata.count === 'number'
            ? String(parsedMetadata.count)
            : ''
        const count = sanitizeSubmissionLimitCount(rawCount)
        const isUnlimited = toBoolean(parsedMetadata.unlimited)
        const isLimited = toBoolean(parsedMetadata.limit)
            || (!isUnlimited && Number(count) > 0)

        return {
            count: isLimited
                ? count
                : '',
            mode: isLimited
                ? LIMITED_MODE
                : UNLIMITED_MODE,
        }
    } catch {
        return defaultSubmissionLimitMetadata
    }
}

/**
 * Serializes the editor state to the legacy submission-limit metadata contract.
 *
 * @param mode selected unlimited or limited mode.
 * @param count digits-only maximum submission count.
 * @returns The JSON string persisted in challenge metadata.
 * @throws Does not throw.
 */
function serializeSubmissionLimitMetadata(
    mode: SubmissionLimitMode,
    count: string | undefined,
): string {
    const isLimited = mode === LIMITED_MODE

    return JSON.stringify({
        count: isLimited
            ? (count || '')
            : '',
        limit: isLimited
            ? 'true'
            : 'false',
        unlimited: isLimited
            ? 'false'
            : 'true',
    })
}

/**
 * Renders and persists the design-challenge submission-limit setting.
 *
 * The radio selection and optional count are form-only fields. Changes are serialized into the
 * legacy `submissionLimit` metadata value consumed by challenge and review applications. Missing
 * or malformed metadata defaults to unlimited without overwriting valid limited challenge data.
 *
 * @param props component options.
 * @returns The submission-limit radio group and the count field when Limited is selected.
 * @throws Does not throw.
 */
export const MaximumSubmissionsField: FC<MaximumSubmissionsFieldProps> = (
    props: MaximumSubmissionsFieldProps,
) => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const dynamicFormControl = formContext.control as any
    const deferredDirtyNormalizationRef = useRef(false)
    const metadata = useWatch({
        control: dynamicFormControl,
        name: 'metadata',
    }) as ChallengeMetadata[] | undefined
    const submissionLimitMode = useWatch({
        control: dynamicFormControl,
        name: SUBMISSION_LIMIT_MODE_FIELD,
    }) as SubmissionLimitMode | undefined
    const submissionLimitCount = useWatch({
        control: dynamicFormControl,
        name: SUBMISSION_LIMIT_COUNT_FIELD,
    }) as string | undefined
    const submissionLimitValue = useMemo(
        () => getMetadataValue(metadata, SUBMISSION_LIMIT_FIELD),
        [metadata],
    )
    const parsedSubmissionLimitMetadata = useMemo(
        () => parseSubmissionLimitMetadata(submissionLimitValue),
        [submissionLimitValue],
    )

    useEffect(() => {
        if (submissionLimitMode === undefined) {
            formContext.setValue(
                SUBMISSION_LIMIT_MODE_FIELD as never,
                parsedSubmissionLimitMetadata.mode as never,
                {
                    shouldDirty: false,
                    shouldValidate: false,
                },
            )
        }

        if (submissionLimitCount === undefined) {
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
        parsedSubmissionLimitMetadata.count,
        parsedSubmissionLimitMetadata.mode,
        submissionLimitCount,
        submissionLimitMode,
    ])

    useEffect(() => {
        if (submissionLimitMode === undefined || submissionLimitCount === undefined) {
            return
        }

        const nextSubmissionLimitValue = serializeSubmissionLimitMetadata(
            submissionLimitMode,
            submissionLimitCount,
        )

        if (submissionLimitValue === nextSubmissionLimitValue) {
            return
        }

        deferredDirtyNormalizationRef.current = props.deferDirty === true

        formContext.setValue(
            'metadata',
            setMetadataValue(
                metadata,
                SUBMISSION_LIMIT_FIELD,
                nextSubmissionLimitValue,
            ),
            {
                shouldDirty: props.deferDirty !== true,
                shouldValidate: true,
            },
        )
    }, [
        formContext,
        metadata,
        props.deferDirty,
        submissionLimitCount,
        submissionLimitMode,
        submissionLimitValue,
    ])

    useEffect(() => {
        if (
            props.deferDirty
            || !deferredDirtyNormalizationRef.current
            || submissionLimitMode === undefined
            || submissionLimitCount === undefined
        ) {
            return
        }

        const normalizedSubmissionLimitValue = serializeSubmissionLimitMetadata(
            submissionLimitMode,
            submissionLimitCount,
        )

        if (submissionLimitValue !== normalizedSubmissionLimitValue) {
            return
        }

        deferredDirtyNormalizationRef.current = false

        formContext.setValue(
            'metadata',
            setMetadataValue(
                metadata,
                SUBMISSION_LIMIT_FIELD,
                normalizedSubmissionLimitValue,
            ),
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        )
    }, [
        formContext,
        metadata,
        props.deferDirty,
        submissionLimitCount,
        submissionLimitMode,
        submissionLimitValue,
    ])

    const handleModeChange = useCallback((value: boolean | string): void => {
        if (value !== UNLIMITED_MODE || !submissionLimitCount) {
            return
        }

        formContext.setValue(
            SUBMISSION_LIMIT_COUNT_FIELD as never,
            '' as never,
            {
                shouldDirty: true,
                shouldValidate: false,
            },
        )
    }, [
        formContext,
        submissionLimitCount,
    ])

    return (
        <div className={styles.container}>
            <FormRadioGroup
                label='Submission limit'
                name={SUBMISSION_LIMIT_MODE_FIELD}
                onChange={handleModeChange}
                options={submissionLimitOptions}
            />

            {submissionLimitMode === LIMITED_MODE
                ? (
                    <FormTextField
                        className={styles.countField}
                        label='Limit count'
                        min={1}
                        name={SUBMISSION_LIMIT_COUNT_FIELD}
                        placeholder='Enter submission limit'
                        sanitize={sanitizeSubmissionLimitCount}
                        type='number'
                    />
                )
                : undefined}
        </div>
    )
}

export default MaximumSubmissionsField
