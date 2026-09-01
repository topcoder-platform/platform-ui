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
import {
    hasChallengeSubmissions,
    parseSubmissionLimitMetadata,
    sanitizeSubmissionLimitCount,
    serializeSubmissionLimitMetadata,
    SubmissionLimitMode,
    SUBMISSION_LIMIT_LIMITED_MODE,
    SUBMISSION_LIMIT_METADATA_NAME,
    SUBMISSION_LIMIT_UNLIMITED_MODE,
} from '../../../../../lib/utils/submission-limit.utils'

import styles from './MaximumSubmissionsField.module.scss'

const SUBMISSION_LIMIT_FIELD = SUBMISSION_LIMIT_METADATA_NAME
const SUBMISSION_LIMIT_COUNT_FIELD = 'submissionLimitCount'
const SUBMISSION_LIMIT_MODE_FIELD = 'submissionLimitMode'
const LIMITED_MODE = SUBMISSION_LIMIT_LIMITED_MODE
const UNLIMITED_MODE = SUBMISSION_LIMIT_UNLIMITED_MODE
const SUBMITTED_LIMIT_LOCK_HINT
    = 'The submission limit cannot be changed after the first submission is uploaded.'

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

interface MaximumSubmissionsFieldProps {
    /**
     * Defers automatic metadata normalization while the editor restores persisted assignments.
     * User changes still persist immediately; once hydration finishes, newly defaulted metadata
     * is marked dirty so save/autosave persists the canonical unlimited payload.
     */
    deferDirty?: boolean
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
        trigger,
    }: Pick<
        UseFormReturn<SubmissionLimitFormData>,
        'control' | 'getValues' | 'setValue' | 'trigger'
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
    const numOfSubmissions = useWatch({
        control,
        name: 'numOfSubmissions',
    }) as number | string | undefined
    const numOfCheckpointSubmissions = useWatch({
        control,
        name: 'numOfCheckpointSubmissions',
    }) as number | string | undefined
    const submissionLimitValue = getMetadataValue(metadata, SUBMISSION_LIMIT_FIELD)
    const isLocked = hasChallengeSubmissions({
        numOfCheckpointSubmissions,
        numOfSubmissions,
    })

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

    /*
     * The selection and count are display-only fields, so every editor form reset drops them
     * without changing any value this component watches. Running on each render re-seeds them
     * from the current challenge metadata, which keeps the saved limit visible after the
     * challenge loads and after a draft save resets the form.
     */
    useEffect(() => {
        const currentSubmissionLimit = parseSubmissionLimitMetadata(
            getMetadataValue(getValues('metadata'), SUBMISSION_LIMIT_FIELD),
        )

        if (
            submissionLimitMode === currentSubmissionLimit.mode
            && (submissionLimitCount || '') === currentSubmissionLimit.count
        ) {
            return
        }

        setValue(
            SUBMISSION_LIMIT_MODE_FIELD,
            currentSubmissionLimit.mode,
            {
                shouldDirty: false,
                shouldValidate: false,
            },
        )
        setValue(
            SUBMISSION_LIMIT_COUNT_FIELD,
            currentSubmissionLimit.count,
            {
                shouldDirty: false,
                shouldValidate: false,
            },
        )
    })

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

    /*
     * The required-count rule is validated from the persisted metadata, which this component
     * writes after React Hook Form has already scheduled its own change validation. Revalidating
     * the count field here keeps the error in step with the value that would be saved.
     */
    const revalidateSubmissionLimitCount = useCallback((): void => {
        trigger(SUBMISSION_LIMIT_COUNT_FIELD)
            .catch(() => undefined)
    }, [trigger])

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
        revalidateSubmissionLimitCount()
    }, [
        getValues,
        persistSubmissionLimitMetadata,
        revalidateSubmissionLimitCount,
        setValue,
    ])

    const handleCountChange = useCallback((count: string): void => {
        persistSubmissionLimitMetadata(LIMITED_MODE, count)
        revalidateSubmissionLimitCount()
    }, [
        persistSubmissionLimitMetadata,
        revalidateSubmissionLimitCount,
    ])

    return (
        <div className={styles.container}>
            <FormRadioGroup
                disabled={isLocked}
                hint={isLocked
                    ? SUBMITTED_LIMIT_LOCK_HINT
                    : undefined}
                label='Submission limit'
                name={SUBMISSION_LIMIT_MODE_FIELD}
                onChange={handleModeChange}
                options={submissionLimitOptions}
            />

            {submissionLimitMode === LIMITED_MODE
                ? (
                    <FormTextField
                        className={styles.countField}
                        disabled={isLocked}
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
