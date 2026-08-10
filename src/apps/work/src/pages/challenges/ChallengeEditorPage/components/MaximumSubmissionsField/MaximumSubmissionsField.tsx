import {
    FC,
    useCallback,
    useEffect,
} from 'react'
import {
    useFormContext,
    UseFormReturn,
    useWatch,
} from 'react-hook-form'

import {
    FormRadioGroup,
    FormRadioOption,
} from '../../../../../lib/components/form/FormRadioGroup'
import { FormTextField } from '../../../../../lib/components/form/FormTextField'
import {
    ChallengeEditorFormData,
    ChallengeMetadata,
} from '../../../../../lib/models'
import {
    getMetadataValue,
    setMetadataValue,
} from '../../../../../lib/utils/metadata.utils'

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

interface SubmissionLimitFormData extends ChallengeEditorFormData {
    submissionLimitCount?: string
    submissionLimitMode?: SubmissionLimitMode
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
     * Defers automatic metadata normalization while the editor restores persisted assignments.
     * User changes still persist immediately; once hydration finishes, newly defaulted metadata
     * is marked dirty so save/autosave persists the canonical unlimited payload.
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
    const {
        control,
        getValues,
        setValue,
    }: Pick<
        UseFormReturn<SubmissionLimitFormData>,
        'control' | 'getValues' | 'setValue'
    > = useFormContext<SubmissionLimitFormData>()
    const metadata = useWatch({
        control,
        name: 'metadata',
    }) as ChallengeMetadata[] | undefined
    const submissionLimitMode = useWatch({
        control,
        name: SUBMISSION_LIMIT_MODE_FIELD,
    }) as SubmissionLimitMode | undefined
    const submissionLimitCount = useWatch({
        control,
        name: SUBMISSION_LIMIT_COUNT_FIELD,
    }) as string | undefined
    const submissionLimitValue = getMetadataValue(metadata, SUBMISSION_LIMIT_FIELD)

    const persistSubmissionLimitMetadata = useCallback((
        mode: SubmissionLimitMode,
        count: string,
    ): void => {
        const currentMetadata = getValues('metadata')
        const nextSubmissionLimitValue = serializeSubmissionLimitMetadata(mode, count)

        if (getMetadataValue(currentMetadata, SUBMISSION_LIMIT_FIELD) === nextSubmissionLimitValue) {
            return
        }

        setValue(
            'metadata',
            setMetadataValue(
                currentMetadata,
                SUBMISSION_LIMIT_FIELD,
                nextSubmissionLimitValue,
            ),
            {
                shouldDirty: true,
                shouldValidate: false,
            },
        )
    }, [
        getValues,
        setValue,
    ])

    useEffect(() => {
        if (submissionLimitMode !== undefined && submissionLimitCount !== undefined) {
            return
        }

        const currentSubmissionLimitMetadata = parseSubmissionLimitMetadata(
            getMetadataValue(getValues('metadata'), SUBMISSION_LIMIT_FIELD),
        )

        if (submissionLimitMode === undefined) {
            setValue(
                SUBMISSION_LIMIT_MODE_FIELD,
                currentSubmissionLimitMetadata.mode,
                {
                    shouldDirty: false,
                    shouldValidate: false,
                },
            )
        }

        if (submissionLimitCount === undefined) {
            setValue(
                SUBMISSION_LIMIT_COUNT_FIELD,
                currentSubmissionLimitMetadata.count,
                {
                    shouldDirty: false,
                    shouldValidate: false,
                },
            )
        }
    }, [
        getValues,
        setValue,
        submissionLimitCount,
        submissionLimitMode,
        submissionLimitValue,
    ])

    useEffect(() => {
        if (props.deferDirty) {
            return
        }

        const currentMetadata = getValues('metadata')
        const currentSubmissionLimitValue = getMetadataValue(
            currentMetadata,
            SUBMISSION_LIMIT_FIELD,
        )
        const parsedCurrentMetadata = parseSubmissionLimitMetadata(currentSubmissionLimitValue)
        const normalizedSubmissionLimitValue = serializeSubmissionLimitMetadata(
            parsedCurrentMetadata.mode,
            parsedCurrentMetadata.count,
        )

        if (currentSubmissionLimitValue === normalizedSubmissionLimitValue) {
            return
        }

        persistSubmissionLimitMetadata(
            parsedCurrentMetadata.mode,
            parsedCurrentMetadata.count,
        )
    }, [
        getValues,
        persistSubmissionLimitMetadata,
        props.deferDirty,
        submissionLimitValue,
    ])

    const handleModeChange = useCallback((value: boolean | string): void => {
        if (value !== LIMITED_MODE && value !== UNLIMITED_MODE) {
            return
        }

        const count = getValues(SUBMISSION_LIMIT_COUNT_FIELD) || ''

        if (value === UNLIMITED_MODE && count) {
            setValue(
                SUBMISSION_LIMIT_COUNT_FIELD,
                '',
                {
                    shouldDirty: true,
                    shouldValidate: false,
                },
            )
        }

        persistSubmissionLimitMetadata(
            value,
            value === LIMITED_MODE
                ? count
                : '',
        )
    }, [
        getValues,
        persistSubmissionLimitMetadata,
        setValue,
    ])

    const handleCountChange = useCallback((count: string): void => {
        persistSubmissionLimitMetadata(LIMITED_MODE, count)
    }, [persistSubmissionLimitMetadata])

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
                        onChange={handleCountChange}
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
