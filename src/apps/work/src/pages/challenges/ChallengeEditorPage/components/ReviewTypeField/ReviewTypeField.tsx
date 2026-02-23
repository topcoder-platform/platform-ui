import {
    FC,
    useEffect,
    useMemo,
} from 'react'
import type {
    UseFormReturn,
} from 'react-hook-form'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import {
    FormRadioGroup,
    FormSelectField,
    FormSelectOption,
} from '../../../../../lib/components/form'
import { REVIEW_TYPES } from '../../../../../lib/constants/challenge-editor.constants'
import {
    useFetchProjectMembers,
    UseFetchProjectMembersResult,
} from '../../../../../lib/hooks'
import {
    ChallengeEditorFormData,
    ProjectMember,
} from '../../../../../lib/models'

import styles from './ReviewTypeField.module.scss'

interface ReviewTypeFieldProps {
    isTaskChallenge: boolean
    projectId?: string
}

const taskReviewTypeOptions = [
    {
        label: 'Internal',
        value: REVIEW_TYPES.INTERNAL,
    },
]

function normalizeText(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim()
}

function normalizeMemberHandle(member: ProjectMember): string | undefined {
    const handle = normalizeText(member.handle)
    return handle || undefined
}

function deduplicateHandles(handles: string[]): string[] {
    const seenHandles = new Set<string>()

    return handles.filter(handle => {
        const normalizedHandle = handle.toLowerCase()
        if (seenHandles.has(normalizedHandle)) {
            return false
        }

        seenHandles.add(normalizedHandle)
        return true
    })
}

export const ReviewTypeField: FC<ReviewTypeFieldProps> = (
    props: ReviewTypeFieldProps,
) => {
    const {
        isLoading: areProjectMembersLoading,
        members: projectMembers,
    }: UseFetchProjectMembersResult = useFetchProjectMembers(props.projectId)
    const {
        control,
        setValue,
    }: Pick<UseFormReturn<ChallengeEditorFormData>, 'control' | 'setValue'> = useFormContext<ChallengeEditorFormData>()
    const reviewType = useWatch({
        control,
        name: 'legacy.reviewType',
    }) as string | undefined
    const reviewer = useWatch({
        control,
        name: 'reviewer',
    }) as string | undefined

    const reviewerOptions = useMemo<FormSelectOption[]>(
        () => {
            const memberHandles = deduplicateHandles(
                projectMembers
                    .map(member => normalizeMemberHandle(member))
                    .filter((handle): handle is string => !!handle),
            )
                .sort((handleA, handleB) => handleA.localeCompare(handleB))
            const normalizedReviewer = normalizeText(reviewer)

            if (!normalizedReviewer) {
                return memberHandles
                    .map(handle => ({
                        label: handle,
                        value: handle,
                    }))
            }

            const hasReviewerOption = memberHandles
                .some(handle => handle.toLowerCase() === normalizedReviewer.toLowerCase())
            const options = memberHandles
                .map(handle => ({
                    label: handle,
                    value: handle,
                }))

            if (hasReviewerOption) {
                return options
            }

            return [
                {
                    label: normalizedReviewer,
                    value: normalizedReviewer,
                },
                ...options,
            ]
        },
        [
            projectMembers,
            reviewer,
        ],
    )
    const isReviewerSelectDisabled = useMemo(
        (): boolean => {
            if (!props.projectId || areProjectMembersLoading) {
                return true
            }

            return reviewerOptions.length === 0
        },
        [
            areProjectMembersLoading,
            props.projectId,
            reviewerOptions.length,
        ],
    )

    useEffect(() => {
        if (!props.isTaskChallenge) {
            return
        }

        if (normalizeText(reviewType)
            .toUpperCase() === REVIEW_TYPES.INTERNAL
        ) {
            return
        }

        setValue('legacy.reviewType', REVIEW_TYPES.INTERNAL, {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [
        props.isTaskChallenge,
        reviewType,
        setValue,
    ])

    if (!props.isTaskChallenge) {
        return <></>
    }

    return (
        <div className={styles.container}>
            <FormRadioGroup
                disabled
                label='Review Type'
                name='legacy.reviewType'
                options={taskReviewTypeOptions}
                required
            />
            <FormSelectField
                disabled={isReviewerSelectDisabled}
                hint={isReviewerSelectDisabled
                    ? 'No project members available to assign as reviewer.'
                    : undefined}
                label='Reviewer'
                name='reviewer'
                options={reviewerOptions}
                placeholder={isReviewerSelectDisabled
                    ? 'No project members available'
                    : 'Select reviewer'}
                required
            />
        </div>
    )
}

export default ReviewTypeField
