/* eslint-disable complexity */
/* eslint-disable react/jsx-no-bind */

import {
    ChangeEvent,
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    SubmitHandler,
    useForm,
} from 'react-hook-form'
import { Link } from 'react-router-dom'

import { yupResolver } from '@hookform/resolvers/yup'
import {
    Button,
    LoadingSpinner,
    PageTitle,
} from '~/libs/ui'

import {
    ErrorMessage,
    GroupSuccessModal,
    NullLayout,
    ValidationResultsTable,
} from '../../../lib/components'
import { WorkAppContext } from '../../../lib/contexts'
import type {
    UseBulkCreateGroupResult,
    UseBulkSearchMembersResult,
    UseFetchGroupsResult,
} from '../../../lib/hooks'
import {
    useBulkCreateGroup,
    useBulkSearchMembers,
    useFetchGroups,
} from '../../../lib/hooks'
import {
    Group,
    GroupBulkCreateMemberResult,
    MemberValidationResult,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    groupsFormSchema,
    GroupsFormSchemaData,
} from '../../../lib/schemas/groups.schema'
import { parseCSVFile } from '../../../lib/utils'

import styles from './GroupsPage.module.scss'

const DEFAULT_FORM_VALUES: GroupsFormSchemaData = {
    groupDescription: '',
    groupName: '',
    privateGroup: true,
    selfRegister: false,
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallbackMessage
}

function isMatched(result: MemberValidationResult): boolean {
    if (typeof result.match === 'boolean') {
        return result.match
    }

    if (typeof result.matched === 'boolean') {
        return result.matched
    }

    return !!result.userId
}

function getMatchedUserIds(results: MemberValidationResult[]): string[] {
    const userIds = results
        .filter(result => isMatched(result))
        .map(result => (result.userId || '').trim())
        .filter(Boolean)

    return Array.from(new Set(userIds))
}

function getMemberResultsFromError(error: Error | undefined): GroupBulkCreateMemberResult[] {
    if (!error) {
        return []
    }

    const memberResults = (error as Error & {
        memberResults?: unknown
    }).memberResults

    if (!Array.isArray(memberResults)) {
        return []
    }

    const normalizedResults: GroupBulkCreateMemberResult[] = []

    memberResults.forEach(memberResult => {
        if (typeof memberResult !== 'object' || !memberResult) {
            return
        }

        const typedMemberResult = memberResult as Partial<GroupBulkCreateMemberResult>
        const userId = typeof typedMemberResult.userId === 'string'
            ? typedMemberResult.userId.trim()
            : ''

        if (!userId || typeof typedMemberResult.success !== 'boolean') {
            return
        }

        normalizedResults.push({
            error: typeof typedMemberResult.error === 'string'
                ? typedMemberResult.error.trim() || undefined
                : undefined,
            success: typedMemberResult.success,
            userId,
        })
    })

    return normalizedResults
}

function getFailedMemberResults(
    memberResults: GroupBulkCreateMemberResult[],
): GroupBulkCreateMemberResult[] {
    return memberResults.filter(memberResult => !memberResult.success)
}

function getSuccessMemberCount(
    memberResults: GroupBulkCreateMemberResult[],
    fallbackCount: number,
): number {
    if (!memberResults.length) {
        return fallbackCount
    }

    return memberResults.filter(memberResult => memberResult.success).length
}

export const GroupsPage: FC = () => {
    const {
        isAdmin,
        isCopilot,
        isManager,
    }: WorkAppContextModel = useContext(WorkAppContext)
    const canManageGroups = isAdmin || isCopilot || isManager

    const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
    const [fileErrorMessage, setFileErrorMessage] = useState<string | undefined>(undefined)
    const [groupNameFilter, setGroupNameFilter] = useState<string>('')
    const [isParsingFile, setIsParsingFile] = useState<boolean>(false)
    const [memberResults, setMemberResults] = useState<GroupBulkCreateMemberResult[]>([])
    const [parsedIdentifiers, setParsedIdentifiers] = useState<string[]>([])
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
    const [showValidationResults, setShowValidationResults] = useState<boolean>(false)
    const [successGroupName, setSuccessGroupName] = useState<string>('')
    const [successMemberCount, setSuccessMemberCount] = useState<number>(0)
    const [uploadedFileName, setUploadedFileName] = useState<string | undefined>(undefined)
    const [validationCompleted, setValidationCompleted] = useState<boolean>(false)

    const fileInputRef = useRef<HTMLInputElement>()

    const formMethods = useForm<GroupsFormSchemaData>({
        defaultValues: DEFAULT_FORM_VALUES,
        mode: 'onChange',
        resolver: yupResolver(groupsFormSchema) as any,
    })

    const groupsResult: UseFetchGroupsResult = useFetchGroups({
        name: groupNameFilter,
    })
    const groups: Group[] = groupsResult.groups
    const groupsError = groupsResult.error
    const isGroupsLoading = groupsResult.isLoading
    const refreshGroups = groupsResult.mutate

    const bulkCreateGroupResult: UseBulkCreateGroupResult = useBulkCreateGroup()
    const createGroup = bulkCreateGroupResult.createGroup
    const bulkCreateGroupError = bulkCreateGroupResult.error
    const isCreating = bulkCreateGroupResult.isCreating

    const bulkSearchMembersResult: UseBulkSearchMembersResult = useBulkSearchMembers(parsedIdentifiers)
    const bulkSearchMembersError = bulkSearchMembersResult.error
    const isSearching = bulkSearchMembersResult.isSearching
    const searchMembers = bulkSearchMembersResult.searchMembers
    const validationResults = bulkSearchMembersResult.validationResults

    const setFileInputRef = useCallback((element: HTMLInputElement | null): void => {
        fileInputRef.current = element || undefined
    }, [])

    useEffect(() => {
        if (bulkSearchMembersError) {
            setApiErrorMessage(bulkSearchMembersError.message)
        }
    }, [bulkSearchMembersError])

    useEffect(() => {
        if (bulkCreateGroupError) {
            const errorMemberResults = getMemberResultsFromError(bulkCreateGroupError)
            const failedCount = getFailedMemberResults(errorMemberResults).length
            const successfulCount = getSuccessMemberCount(errorMemberResults, 0)

            setMemberResults(errorMemberResults)

            if (failedCount > 0 || successfulCount > 0) {
                setApiErrorMessage(
                    `${bulkCreateGroupError.message} ${successfulCount} succeeded and ${failedCount} failed.`,
                )
            } else {
                setApiErrorMessage(bulkCreateGroupError.message)
            }
        }
    }, [bulkCreateGroupError])

    const failedMemberResults = useMemo(
        () => getFailedMemberResults(memberResults),
        [memberResults],
    )

    const groupDescription = formMethods.watch('groupDescription')
    const groupName = formMethods.watch('groupName')

    const hasUploadedFile = !!uploadedFileName

    const hasRequiredFields = useMemo(
        () => groupDescription.trim().length > 0 && groupName.trim().length > 0,
        [groupDescription, groupName],
    )

    const canCreate = canManageGroups && hasRequiredFields && (!hasUploadedFile || validationCompleted)

    const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.target.files?.[0]

        setApiErrorMessage(undefined)
        setFileErrorMessage(undefined)
        setShowValidationResults(false)
        setValidationCompleted(false)

        if (!file) {
            setParsedIdentifiers([])
            setUploadedFileName(undefined)
            return
        }

        setIsParsingFile(true)

        try {
            const identifiers = await parseCSVFile(file)

            setParsedIdentifiers(identifiers)
            setUploadedFileName(file.name)

            if (!identifiers.length) {
                setFileErrorMessage('Uploaded file does not include any handles or emails.')
            }
        } catch (error) {
            setFileErrorMessage(getErrorMessage(error, 'Unable to read the uploaded file.'))
            setParsedIdentifiers([])
            setUploadedFileName(undefined)
        } finally {
            setIsParsingFile(false)
        }
    }, [])

    const handleReuploadFile = useCallback((): void => {
        setApiErrorMessage(undefined)
        setFileErrorMessage(undefined)
        setMemberResults([])
        setParsedIdentifiers([])
        setShowValidationResults(false)
        setUploadedFileName(undefined)
        setValidationCompleted(false)

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [])

    const handleValidate = useCallback(async (): Promise<void> => {
        if (isParsingFile || isSearching) {
            return
        }

        setApiErrorMessage(undefined)
        setFileErrorMessage(undefined)

        if (!parsedIdentifiers.length) {
            setFileErrorMessage('Please upload a CSV/TXT file with at least one handle or email.')
            return
        }

        await searchMembers(parsedIdentifiers)

        setShowValidationResults(true)
        setValidationCompleted(true)
    }, [
        isParsingFile,
        isSearching,
        parsedIdentifiers,
        searchMembers,
    ])

    const handleSuccessModalClose = useCallback((): void => {
        formMethods.reset(DEFAULT_FORM_VALUES)
        setApiErrorMessage(undefined)
        setFileErrorMessage(undefined)
        setMemberResults([])
        setParsedIdentifiers([])
        setShowSuccessModal(false)
        setShowValidationResults(false)
        setSuccessGroupName('')
        setSuccessMemberCount(0)
        setUploadedFileName(undefined)
        setValidationCompleted(false)

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [formMethods])

    const handleCreateGroup: SubmitHandler<GroupsFormSchemaData> = useCallback(
        async (formData: GroupsFormSchemaData): Promise<void> => {
            if (isCreating || isParsingFile || isSearching) {
                return
            }

            if (!canManageGroups) {
                setApiErrorMessage('You do not have permission to create groups.')
                return
            }

            setApiErrorMessage(undefined)
            setMemberResults([])

            if (hasUploadedFile && !validationCompleted) {
                setFileErrorMessage('Please validate the uploaded file before creating the group.')
                return
            }

            const matchedUserIds = validationCompleted
                ? getMatchedUserIds(validationResults)
                : []

            const createdGroup = await createGroup({
                description: formData.groupDescription.trim(),
                name: formData.groupName.trim(),
                privateGroup: formData.privateGroup,
                selfRegister: formData.selfRegister,
                userIds: matchedUserIds,
            })

            if (!createdGroup) {
                return
            }

            const createdMemberResults = createdGroup.memberResults || []
            const failedResults = getFailedMemberResults(createdMemberResults)
            const successfulMemberCount = getSuccessMemberCount(createdMemberResults, matchedUserIds.length)

            setShowSuccessModal(true)
            setSuccessGroupName(createdGroup.name || formData.groupName.trim())
            setSuccessMemberCount(successfulMemberCount)
            setMemberResults(createdMemberResults)

            if (failedResults.length > 0) {
                setApiErrorMessage(
                    `Group created, but ${failedResults.length} member addition(s) failed.`
                    + ' Review the failed rows below.',
                )
            }

            await refreshGroups()
                .catch(() => undefined)
        },
        [
            canManageGroups,
            createGroup,
            hasUploadedFile,
            isCreating,
            isParsingFile,
            isSearching,
            refreshGroups,
            validationCompleted,
            validationResults,
        ],
    )

    const onSubmit = formMethods.handleSubmit(handleCreateGroup)

    const isWorking = isCreating || isParsingFile || isSearching

    const filteredGroupsCount = groups.length

    if (!canManageGroups) {
        return (
            <NullLayout>
                <PageTitle>Groups</PageTitle>
                <ErrorMessage message='You do not have permission to manage groups.' />
            </NullLayout>
        )
    }

    return (
        <NullLayout>
            <PageTitle>Groups</PageTitle>

            <div className={styles.pageContainer}>
                <section className={styles.section}>
                    <h3 className={styles.pageHeading}>Groups List</h3>

                    <div className={styles.filterRow}>
                        <input
                            className={styles.textInput}
                            onChange={event => {
                                setGroupNameFilter(event.target.value)
                            }}
                            placeholder='Filter groups by name'
                            type='text'
                            value={groupNameFilter}
                        />
                        <Button
                            disabled={!groupNameFilter.trim()}
                            label='Clear Filter'
                            onClick={() => {
                                setGroupNameFilter('')
                            }}
                            secondary
                            size='lg'
                        />
                    </div>

                    <div className={styles.listSummary}>
                        {filteredGroupsCount}
                        {' '}
                        groups found
                    </div>

                    {groupsError
                        ? (
                            <div className={styles.errorBanner} role='alert'>
                                {groupsError.message}
                            </div>
                        )
                        : undefined}

                    {isGroupsLoading
                        ? (
                            <div className={styles.loadingState}>
                                <LoadingSpinner inline />
                                <span className={styles.loadingText}>Loading groups...</span>
                            </div>
                        )
                        : undefined}

                    {!isGroupsLoading && !groupsError && groups.length === 0
                        ? <div className={styles.emptyState}>No groups match the current filter.</div>
                        : undefined}

                    {!isGroupsLoading && !groupsError && groups.length > 0
                        ? (
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th scope='col'>Name</th>
                                            <th scope='col'>Description</th>
                                            <th scope='col'>Private</th>
                                            <th scope='col'>Self Register</th>
                                            <th scope='col'>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groups.map(group => (
                                            <tr key={group.id}>
                                                <td>{group.name}</td>
                                                <td>{group.description || '-'}</td>
                                                <td>{group.privateGroup ? 'Yes' : 'No'}</td>
                                                <td>{group.selfRegister ? 'Yes' : 'No'}</td>
                                                <td>
                                                    <Link
                                                        className={styles.editLink}
                                                        to={`/groups/${group.id}/edit`}
                                                    >
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                        : undefined}
                </section>

                <section className={styles.section}>
                    <h3 className={styles.pageHeading}>Create Group</h3>

                    {apiErrorMessage
                        ? (
                            <div className={styles.errorBanner} role='alert'>
                                {apiErrorMessage}
                            </div>
                        )
                        : undefined}

                    {failedMemberResults.length > 0
                        ? (
                            <div className={styles.warningBanner} role='alert'>
                                <div className={styles.warningHeading}>Failed Member Additions</div>
                                <ul className={styles.warningList}>
                                    {failedMemberResults.map(failedResult => (
                                        <li key={`${failedResult.userId}-${failedResult.error || 'unknown'}`}>
                                            {failedResult.userId}
                                            {failedResult.error
                                                ? `: ${failedResult.error}`
                                                : ': Failed to add member.'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                        : undefined}

                    <form className={styles.form} onSubmit={onSubmit}>
                        <div className={styles.formRow}>
                            <label className={styles.fieldLabel} htmlFor='groupName'>
                                Group Name
                                <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.fieldValue}>
                                <input
                                    className={styles.textInput}
                                    id='groupName'
                                    type='text'
                                    {...formMethods.register('groupName')}
                                />
                                {formMethods.formState.errors.groupName?.message
                                    ? (
                                        <div className={styles.fieldError}>
                                            {formMethods.formState.errors.groupName.message}
                                        </div>
                                    )
                                    : undefined}
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <label className={styles.fieldLabel} htmlFor='groupDescription'>
                                Description
                                <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.fieldValue}>
                                <textarea
                                    className={styles.textArea}
                                    id='groupDescription'
                                    rows={4}
                                    {...formMethods.register('groupDescription')}
                                />
                                {formMethods.formState.errors.groupDescription?.message
                                    ? (
                                        <div className={styles.fieldError}>
                                            {formMethods.formState.errors.groupDescription.message}
                                        </div>
                                    )
                                    : undefined}
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <span className={styles.fieldLabel}>Group Options</span>
                            <div className={styles.fieldValue}>
                                <div className={styles.checkboxGroup}>
                                    <label className={styles.checkboxItem} htmlFor='selfRegister'>
                                        <input
                                            id='selfRegister'
                                            type='checkbox'
                                            {...formMethods.register('selfRegister')}
                                        />
                                        <span>Self Registration</span>
                                    </label>
                                    <label className={styles.checkboxItem} htmlFor='privateGroup'>
                                        <input
                                            id='privateGroup'
                                            type='checkbox'
                                            {...formMethods.register('privateGroup')}
                                        />
                                        <span>Private</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <label className={styles.fieldLabel} htmlFor='groupFile'>
                                Upload User List (CSV/TXT)
                            </label>
                            <div className={styles.fieldValue}>
                                <input
                                    accept='.txt,.csv'
                                    aria-label='Upload user list file'
                                    className={styles.fileInput}
                                    id='groupFile'
                                    onChange={handleFileChange}
                                    ref={setFileInputRef}
                                    type='file'
                                />
                                <span className={styles.helperText}>
                                    Optional. One handle or email per line. Validate to add members.
                                </span>
                                {uploadedFileName
                                    ? (
                                        <div className={styles.fileName}>
                                            Uploaded file:
                                            {' '}
                                            {uploadedFileName}
                                        </div>
                                    )
                                    : undefined}
                                {fileErrorMessage
                                    ? <div className={styles.fieldError}>{fileErrorMessage}</div>
                                    : undefined}
                            </div>
                        </div>

                        <div className={styles.buttonGroup}>
                            <Button
                                disabled={isWorking || !parsedIdentifiers.length}
                                label={isSearching ? 'Validating...' : 'Validate'}
                                onClick={handleValidate}
                                secondary
                                size='lg'
                            />
                            <Button
                                disabled={isWorking || !hasUploadedFile}
                                label='Re-upload File'
                                onClick={handleReuploadFile}
                                secondary
                                size='lg'
                            />
                            <Button
                                disabled={isWorking || !canCreate}
                                label={isCreating ? 'Creating Group...' : 'Create Group'}
                                primary
                                size='lg'
                                type='submit'
                            />
                        </div>
                    </form>

                    {isWorking
                        ? (
                            <div aria-live='polite' className={styles.loadingState}>
                                <LoadingSpinner inline />
                                <span className={styles.loadingText}>
                                    {isParsingFile
                                        ? 'Parsing uploaded file...'
                                        : undefined}
                                    {isSearching
                                        ? 'Validating members...'
                                        : undefined}
                                    {isCreating
                                        ? 'Creating group...'
                                        : undefined}
                                </span>
                            </div>
                        )
                        : undefined}

                    {showValidationResults
                        ? (
                            <ValidationResultsTable
                                results={validationResults}
                            />
                        )
                        : undefined}
                </section>
            </div>

            {showSuccessModal
                ? (
                    <GroupSuccessModal
                        groupName={successGroupName}
                        memberCount={successMemberCount}
                        onClose={handleSuccessModalClose}
                    />
                )
                : undefined}
        </NullLayout>
    )
}

export default GroupsPage
