import {
    FC,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import AsyncSelect from 'react-select/async'

import { BaseModal, Button } from '~/libs/ui'

import { WorkAppContext } from '../../contexts'
import { useFetchProjectTypes } from '../../hooks'
import { Project, WorkAppContextModel } from '../../models'
import { fetchProjectsList, ProjectSummary } from '../../services'
import { checkCanManageProject, hasAdminRole } from '../../utils'
import { ErrorMessage } from '../ErrorMessage'
import { LoadingSpinner } from '../LoadingSpinner'
import { ProjectEditorForm, ProjectEditorFormEmbedding } from '../ProjectEditorForm'

import styles from './CreateEngagementFromLeadModal.module.scss'

export const PROJECT_SEARCH_DEBOUNCE_MS = 300
const PROJECT_SEARCH_PAGE_SIZE = 20

export interface CreateEngagementFromLeadModalProps {
    accountName: string
    isOpen: boolean
    leadId: string
    onCancel: () => void
    /** Opens the engagement editor in the given project. */
    onConfirm: (projectId: string) => void
    roleTitle?: string | null
}

interface ProjectOption {
    label: string
    value: string
}

function toProjectOption(project: ProjectSummary): ProjectOption {
    return {
        label: `${project.name} (${project.id})`,
        value: String(project.id),
    }
}

// The menu is rendered into the page body, so it needs to sit above the modal.
const PROJECT_SELECT_STYLES = {
    menuPortal: (provided: Record<string, unknown>) => ({
        ...provided,
        zIndex: 9999,
    }),
}

interface NewProjectFormProps {
    onCancel: () => void
    onCreated: (project: Project) => void
}

const NewProjectForm: FC<NewProjectFormProps> = (props: NewProjectFormProps) => {
    const { loginUserInfo }: WorkAppContextModel = useContext(WorkAppContext)
    const projectTypesResult = useFetchProjectTypes()

    const embedding = useMemo<ProjectEditorFormEmbedding>(
        () => ({ onCancel: props.onCancel, onCreated: props.onCreated }),
        [props.onCancel, props.onCreated],
    )

    if (projectTypesResult.isLoading) {
        return <LoadingSpinner />
    }

    if (projectTypesResult.error) {
        return <ErrorMessage message={projectTypesResult.error.message || 'Failed to load project types.'} />
    }

    return (
        <ProjectEditorForm
            billingAccountSearchUserId={loginUserInfo?.userId}
            canManage={false}
            embedded={embedding}
            isEdit={false}
            projectTypes={projectTypesResult.projectTypes}
        />
    )
}

/**
 * Picks the project to create an engagement from a lead in: an existing one the user can access, found by
 * name, or a new one created in place.
 */
export const CreateEngagementFromLeadModal: FC<CreateEngagementFromLeadModalProps> = (
    props: CreateEngagementFromLeadModalProps,
) => {
    const { loginUserInfo, userRoles }: WorkAppContextModel = useContext(WorkAppContext)
    const canCreateProject = checkCanManageProject(userRoles, loginUserInfo?.userId)
    // Managers and Talent Managers can read any project, but should only create engagements in the projects
    // they are a member of (or invited to). Admins can create engagements in any project.
    const memberOnly = !hasAdminRole(userRoles)

    const [selectedProject, setSelectedProject] = useState<ProjectOption | undefined>()
    const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false)
    const [searchError, setSearchError] = useState<string | undefined>()

    const menuPortalTarget = useMemo(
        () => (typeof document === 'undefined' ? undefined : document.body),
        [],
    )

    const searchProjects = useCallback(async (keyword: string): Promise<ProjectOption[]> => {
        setSearchError(undefined)

        try {
            const response = await fetchProjectsList({
                keyword,
                memberOnly,
                perPage: PROJECT_SEARCH_PAGE_SIZE,
            })

            return response.projects.map(toProjectOption)
        } catch (error) {
            setSearchError(error instanceof Error ? error.message : 'Failed to search projects.')
            return []
        }
    }, [memberOnly])

    const loadProjectOptions = useMemo(() => {
        let timeoutId: number | undefined
        let resolvePending: ((options: ProjectOption[]) => void) | undefined

        return (keyword: string): Promise<ProjectOption[]> => new Promise(resolve => {
            // The search this one replaces is never run; settle it so it isn't left pending.
            // react-select ignores results for input that has since changed.
            window.clearTimeout(timeoutId)
            resolvePending?.([])
            resolvePending = resolve

            timeoutId = window.setTimeout(() => {
                resolvePending = undefined
                searchProjects(keyword.trim())
                    .then(resolve)
            }, PROJECT_SEARCH_DEBOUNCE_MS)
        })
    }, [searchProjects])

    const handleProjectChange = useCallback((option: unknown): void => {
        setSelectedProject((option as ProjectOption | null) || undefined)
    }, [])

    const noOptionsMessage = useCallback(
        ({ inputValue }: { inputValue: string }): string => (
            inputValue.trim() ? 'No matching projects found' : 'Type a project name to search'
        ),
        [],
    )

    const handleConfirm = useCallback((): void => {
        if (selectedProject) {
            props.onConfirm(selectedProject.value)
        }
    }, [props, selectedProject])

    const handleShowCreateProject = useCallback((): void => {
        setIsCreatingProject(true)
    }, [])

    const handleHideCreateProject = useCallback((): void => {
        setIsCreatingProject(false)
    }, [])

    const handleProjectCreated = useCallback((project: Project): void => {
        props.onConfirm(String(project.id))
    }, [props])

    if (!props.isOpen) {
        return undefined
    }

    const roleLabel = props.roleTitle ? `for "${props.roleTitle}" ` : ''

    return (
        <BaseModal
            open
            onClose={props.onCancel}
            size={isCreatingProject ? 'lg' : 'md'}
            title='Create Engagement from Lead'
            buttons={isCreatingProject ? undefined : (
                <>
                    <Button
                        label='Cancel'
                        onClick={props.onCancel}
                        secondary
                    />
                    <Button
                        disabled={!selectedProject}
                        label='Create Engagement'
                        onClick={handleConfirm}
                        primary
                    />
                </>
            )}
        >
            <p className={styles.message}>
                {`Create an engagement ${roleLabel}at ${props.accountName}.`}
            </p>

            {isCreatingProject
                ? (
                    <section className={styles.newProject}>
                        <h4 className={styles.newProjectTitle}>New project for this engagement</h4>
                        <NewProjectForm
                            onCancel={handleHideCreateProject}
                            onCreated={handleProjectCreated}
                        />
                    </section>
                )
                : (
                    <>
                        <label className={styles.field} htmlFor='create-engagement-project'>
                            <span className={styles.label}>Select an existing project to create the engagement in</span>
                            <AsyncSelect
                                aria-label='Project'
                                cacheOptions
                                classNamePrefix='project-select'
                                defaultOptions
                                inputId='create-engagement-project'
                                isClearable
                                loadOptions={loadProjectOptions}
                                menuPortalTarget={menuPortalTarget}
                                noOptionsMessage={noOptionsMessage}
                                onChange={handleProjectChange}
                                placeholder='Search projects by name'
                                styles={PROJECT_SELECT_STYLES}
                                value={selectedProject}
                            />
                        </label>
                        {searchError && <p className={styles.error}>{searchError}</p>}

                        {canCreateProject && (
                            <button
                                className={styles.createProjectLink}
                                onClick={handleShowCreateProject}
                                type='button'
                            >
                                Create a new project for this engagement
                            </button>
                        )}
                    </>
                )}

            <p className={styles.hint}>
                Lead ID:
                {' '}
                {props.leadId}
            </p>
        </BaseModal>
    )
}

export default CreateEngagementFromLeadModal
