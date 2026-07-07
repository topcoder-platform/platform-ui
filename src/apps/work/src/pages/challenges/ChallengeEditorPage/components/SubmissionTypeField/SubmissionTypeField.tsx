import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'

import {
    FormRadioGroup,
    FormRadioOption,
} from '../../../../../lib/components/form'
import {
    ChallengeEditorFormData,
    ChallengeMetadata,
    Group,
} from '../../../../../lib/models'
import { fetchGroupById } from '../../../../../lib/services'
import {
    getMetadataValue,
    setMetadataValue,
} from '../../../../../lib/utils/metadata.utils'

const SUBMISSION_TYPE_FORM_FIELD = 'submissionType'
const SUBMISSION_TYPE_METADATA_FIELD = 'submission_type'

export const SUBMISSION_TYPES = {
    URL: 'url',
    ZIP: 'zip',
} as const

type SubmissionType = typeof SUBMISSION_TYPES[keyof typeof SUBMISSION_TYPES]

interface SubmissionTypeResolverParams {
    groupIds?: string[]
    groupsById?: Record<string, Group | undefined>
    metadata?: ChallengeMetadata[]
}

const submissionTypeOptions: FormRadioOption<string>[] = [
    {
        label: 'Zip file',
        value: SUBMISSION_TYPES.ZIP,
    },
    {
        label: 'URL',
        value: SUBMISSION_TYPES.URL,
    },
]

/**
 * Normalizes user, form, or metadata values into a supported submission type.
 *
 * @param value raw value from metadata or the radio-group callback.
 * @returns normalized submission type, or `undefined` when unsupported.
 * @throws Does not throw.
 */
function normalizeSubmissionType(value: unknown): SubmissionType | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value.trim()
        .toLowerCase()

    if (normalizedValue === SUBMISSION_TYPES.ZIP || normalizedValue === SUBMISSION_TYPES.URL) {
        return normalizedValue
    }

    return undefined
}

/**
 * Normalizes the selected challenge group ids from React Hook Form.
 *
 * @param value raw form value from the `groups` field.
 * @returns trimmed non-empty group ids.
 * @throws Does not throw.
 */
function normalizeGroupIds(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map(groupId => (typeof groupId === 'string'
            ? groupId.trim()
            : ''))
        .filter(Boolean)
}

/**
 * Normalizes group names for prefix comparisons.
 *
 * @param value raw group name from the Groups API.
 * @returns lower-case group name with collapsed whitespace.
 * @throws Does not throw.
 */
function normalizeGroupName(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
}

/**
 * Checks whether a selected group should use the legacy URL upload default.
 *
 * @param group group details fetched from the Groups API.
 * @returns `true` when the group name starts with Wipro or Topgear.
 * @throws Does not throw.
 */
function isTopgearOrWiproGroup(group: Group | undefined): boolean {
    const normalizedName = normalizeGroupName(group?.name)

    return normalizedName === 'topgear'
        || normalizedName.startsWith('topgear ')
        || normalizedName.startsWith('topgear -')
        || normalizedName === 'wipro'
        || normalizedName.startsWith('wipro ')
        || normalizedName.startsWith('wipro -')
}

/**
 * Resolves the editable submission type for a challenge editor form.
 *
 * Explicit `submission_type` metadata is the source of truth. When absent, the
 * work app defaults Wipro/Topgear groups to URL uploads and all other
 * challenges to normal Topcoder zip uploads, matching community-app behavior.
 *
 * @param params challenge metadata plus selected group ids and fetched group details.
 * @returns `url` or `zip` for the radio field value.
 * @throws Does not throw.
 */
export function resolveSubmissionType(params: SubmissionTypeResolverParams): SubmissionType {
    const explicitSubmissionType = normalizeSubmissionType(
        getMetadataValue(params.metadata, SUBMISSION_TYPE_METADATA_FIELD),
    )

    if (explicitSubmissionType) {
        return explicitSubmissionType
    }

    const selectedGroupIds = normalizeGroupIds(params.groupIds)
    const hasTopgearOrWiproGroup = selectedGroupIds
        .some(groupId => isTopgearOrWiproGroup(params.groupsById?.[groupId]))

    return hasTopgearOrWiproGroup
        ? SUBMISSION_TYPES.URL
        : SUBMISSION_TYPES.ZIP
}

/**
 * Renders the submission-flow selector backed by challenge metadata.
 *
 * The radio selection writes `submission_type=zip` or `submission_type=url` into
 * the challenge metadata. If no metadata exists yet, the displayed default is
 * resolved from the selected groups and persisted only after a user changes it.
 *
 * @returns The submission type radio group used by the challenge editor.
 * @throws Does not throw.
 */
export const SubmissionTypeField: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const dynamicFormControl = formContext.control as any
    const metadata = useWatch({
        control: dynamicFormControl,
        name: 'metadata',
    }) as ChallengeMetadata[] | undefined
    const groupIds = useWatch({
        control: dynamicFormControl,
        name: 'groups',
    }) as string[] | undefined
    const submissionType = useWatch({
        control: dynamicFormControl,
        name: SUBMISSION_TYPE_FORM_FIELD,
    }) as string | undefined
    const [groupsById, setGroupsById] = useState<Record<string, Group | undefined>>({})
    const [hasUserSelectedSubmissionType, setHasUserSelectedSubmissionType] = useState(false)

    const selectedGroupIds = useMemo(
        () => normalizeGroupIds(groupIds),
        [groupIds],
    )
    const selectedGroupKey = useMemo(
        () => selectedGroupIds.join('|'),
        [selectedGroupIds],
    )
    const explicitSubmissionType = useMemo(
        () => normalizeSubmissionType(
            getMetadataValue(metadata, SUBMISSION_TYPE_METADATA_FIELD),
        ),
        [metadata],
    )

    useEffect(() => {
        if (explicitSubmissionType) {
            return undefined
        }

        const currentSelectedGroupIds = selectedGroupKey
            ? selectedGroupKey.split('|')
            : []
        const missingGroupIds = currentSelectedGroupIds
            .filter(groupId => !groupsById[groupId])

        if (!missingGroupIds.length) {
            return undefined
        }

        let isMounted = true

        Promise.all(missingGroupIds.map(async groupId => {
            try {
                return {
                    group: await fetchGroupById(groupId),
                    groupId,
                }
            } catch {
                return {
                    group: undefined,
                    groupId,
                }
            }
        }))
            .then(resolvedGroups => {
                if (!isMounted) {
                    return
                }

                setGroupsById(previousGroupsById => ({
                    ...previousGroupsById,
                    ...resolvedGroups.reduce<Record<string, Group | undefined>>(
                        (nextGroupsById, resolvedGroup) => ({
                            ...nextGroupsById,
                            [resolvedGroup.groupId]: resolvedGroup.group,
                        }),
                        {},
                    ),
                }))
            })

        return () => {
            isMounted = false
        }
    }, [
        explicitSubmissionType,
        groupsById,
        selectedGroupKey,
    ])

    const resolvedSubmissionType = useMemo(
        () => resolveSubmissionType({
            groupIds: selectedGroupIds,
            groupsById,
            metadata,
        }),
        [
            groupsById,
            metadata,
            selectedGroupIds,
        ],
    )

    useEffect(() => {
        if (
            submissionType === resolvedSubmissionType
            || (!explicitSubmissionType && hasUserSelectedSubmissionType)
        ) {
            return
        }

        formContext.setValue(
            SUBMISSION_TYPE_FORM_FIELD as never,
            resolvedSubmissionType as never,
            {
                shouldDirty: false,
                shouldValidate: false,
            },
        )
    }, [
        explicitSubmissionType,
        formContext,
        hasUserSelectedSubmissionType,
        resolvedSubmissionType,
        submissionType,
    ])

    const handleSubmissionTypeChange = useCallback((value: boolean | string): void => {
        const nextSubmissionType = normalizeSubmissionType(value)

        if (!nextSubmissionType || nextSubmissionType === explicitSubmissionType) {
            return
        }

        setHasUserSelectedSubmissionType(true)
        formContext.setValue(
            'metadata',
            setMetadataValue(
                metadata,
                SUBMISSION_TYPE_METADATA_FIELD,
                nextSubmissionType,
            ),
            {
                shouldDirty: true,
                shouldValidate: true,
            },
        )
    }, [
        explicitSubmissionType,
        formContext,
        metadata,
    ])

    return (
        <FormRadioGroup
            label='Submission type'
            name={SUBMISSION_TYPE_FORM_FIELD}
            onChange={handleSubmissionTypeChange}
            options={submissionTypeOptions}
        />
    )
}

export default SubmissionTypeField
