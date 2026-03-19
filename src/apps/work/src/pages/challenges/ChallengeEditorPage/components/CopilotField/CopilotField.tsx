import {
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'
import type {
    UseFormReturn,
} from 'react-hook-form'

import { Button } from '~/libs/ui'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../../lib/components/form'
import { PROJECT_ROLES } from '../../../../../lib/constants'
import { WorkAppContext } from '../../../../../lib/contexts'
import {
    useFetchProjectMembers,
    UseFetchProjectMembersResult,
} from '../../../../../lib/hooks'
import {
    PRIZE_SET_TYPES,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    ChallengeEditorFormData,
    PrizeSet,
    ProjectMember,
    WorkAppContextModel,
} from '../../../../../lib/models'

import styles from './CopilotField.module.scss'

const COPILOT_REQUIRED_MESSAGE = 'Copilot is required when copilot fee is greater than 0'

interface CopilotFieldProps {
    projectId?: string
}

function getCopilotFee(prizeSets: PrizeSet[] | undefined): number {
    if (!Array.isArray(prizeSets)) {
        return 0
    }

    return Number(
        prizeSets.find(prizeSet => prizeSet.type === PRIZE_SET_TYPES.COPILOT)
            ?.prizes?.[0]
            ?.value,
    ) || 0
}

function normalizeHandle(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value.trim()
    return normalizedValue || undefined
}

function normalizeProjectCopilotHandle(member: ProjectMember): string | undefined {
    const normalizedRole = String(member.role || '')
        .trim()
        .toLowerCase()
    const handle = normalizeHandle(member.handle)

    if (normalizedRole !== PROJECT_ROLES.COPILOT || !handle) {
        return undefined
    }

    return handle
}

function deduplicateCopilotHandles(handles: string[]): string[] {
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

export const CopilotField: FC<CopilotFieldProps> = (props: CopilotFieldProps) => {
    const {
        loginUserInfo,
    }: WorkAppContextModel = useContext(WorkAppContext)
    const {
        isLoading: areProjectMembersLoading,
        members: projectMembers,
    }: UseFetchProjectMembersResult = useFetchProjectMembers(props.projectId)

    const {
        clearErrors,
        control,
        getFieldState,
        setError,
        setValue,
    }: Pick<UseFormReturn<ChallengeEditorFormData>,
        'clearErrors'
        | 'control'
        | 'getFieldState'
        | 'setError'
        | 'setValue'
    > = useFormContext<ChallengeEditorFormData>()

    const copilot = useWatch({
        control,
        name: 'copilot',
    }) as string | undefined
    const prizeSets = useWatch({
        control,
        name: 'prizeSets',
    }) as PrizeSet[] | undefined
    const projectCopilotHandles = useMemo(
        () => deduplicateCopilotHandles(
            projectMembers
                .map(normalizeProjectCopilotHandle)
                .filter((handle): handle is string => !!handle),
        )
            .sort((handleA, handleB) => handleA.localeCompare(handleB)),
        [projectMembers],
    )
    const copilotOptions = useMemo<FormSelectOption[]>(
        () => {
            const options = projectCopilotHandles
                .map(handle => ({
                    label: handle,
                    value: handle,
                }))
            const normalizedSelectedCopilot = normalizeHandle(copilot)

            if (!normalizedSelectedCopilot) {
                return options
            }

            const hasProjectCopilotOption = projectCopilotHandles
                .some(handle => handle.toLowerCase() === normalizedSelectedCopilot.toLowerCase())

            if (hasProjectCopilotOption) {
                return options
            }

            return [
                {
                    label: normalizedSelectedCopilot,
                    value: normalizedSelectedCopilot,
                },
                ...options,
            ]
        },
        [
            copilot,
            projectCopilotHandles,
        ],
    )
    const assignableCurrentUserHandle = useMemo((): string | undefined => {
        const normalizedCurrentUserHandle = normalizeHandle(loginUserInfo?.handle)

        if (!normalizedCurrentUserHandle) {
            return undefined
        }

        return projectCopilotHandles.find(handle => (
            handle.toLowerCase() === normalizedCurrentUserHandle.toLowerCase()
        ))
    }, [
        loginUserInfo?.handle,
        projectCopilotHandles,
    ])
    const isCopilotSelectDisabled = useMemo(
        (): boolean => {
            if (!props.projectId) {
                return true
            }

            if (areProjectMembersLoading) {
                return true
            }

            return copilotOptions.length === 0
        },
        [
            areProjectMembersLoading,
            copilotOptions.length,
            props.projectId,
        ],
    )

    useEffect(() => {
        const copilotFee = getCopilotFee(prizeSets)
        const normalizedCopilot = typeof copilot === 'string'
            ? copilot.trim()
            : ''
        const copilotError = getFieldState('copilot').error

        if (copilotFee > 0 && !normalizedCopilot) {
            if (
                copilotError?.type !== 'manual'
                || copilotError.message !== COPILOT_REQUIRED_MESSAGE
            ) {
                setError('copilot', {
                    message: COPILOT_REQUIRED_MESSAGE,
                    type: 'manual',
                })
            }

            return
        }

        if (
            copilotError?.type === 'manual'
            && copilotError.message === COPILOT_REQUIRED_MESSAGE
        ) {
            clearErrors('copilot')
        }
    }, [clearErrors, copilot, getFieldState, prizeSets, setError])

    const assignYourself = useCallback((): void => {
        if (!assignableCurrentUserHandle) {
            return
        }

        setValue('copilot', assignableCurrentUserHandle, {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [assignableCurrentUserHandle, setValue])

    return (
        <div className={styles.container}>
            <FormSelectField
                disabled={isCopilotSelectDisabled}
                isClearable
                label='Copilot'
                name='copilot'
                options={copilotOptions}
                placeholder={isCopilotSelectDisabled
                    ? 'No project copilots available'
                    : 'Select copilot'}
            />
            <div className={styles.actions}>
                <Button
                    disabled={!assignableCurrentUserHandle}
                    label='Assign yourself'
                    onClick={assignYourself}
                    secondary
                />
            </div>
        </div>
    )
}

export default CopilotField
