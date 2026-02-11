import { PROJECT_ROLES } from './project-roles.constants'

export const SUBMITTER_ROLE_UUID = process.env.REACT_APP_SUBMITTER_ROLE_UUID
    || process.env.SUBMITTER_ROLE_UUID
    || '732339e7-8e30-49d7-9198-cccf9451e221'

export const ADMIN_ROLES = [
    'administrator',
    'connect admin',
] as const

export const MANAGER_ROLES = [
    'project manager',
    'topcoder project manager',
    'talent manager',
    'topcoder talent manager',
] as const

export const COPILOT_ROLES = [
    'copilot',
] as const

export const TASK_MANAGER_ROLES = [
    'topcoder task manager',
    'task manager',
    'topcoder talent manager',
    'talent manager',
] as const

export const ALLOWED_USER_ROLES = [
    'copilot',
    'administrator',
    'connect admin',
    'connect manager',
    'connect copilot',
    'project manager',
    'topcoder project manager',
    'talent manager',
    'topcoder talent manager',
    'task manager',
    'topcoder user',
    'topcoder task manager',
] as const

export const READ_ONLY_ROLES = [
    'topcoder user',
] as const

export const ALLOWED_EDIT_RESOURCE_ROLES = [
    'administrator',
    PROJECT_ROLES.MANAGER,
    PROJECT_ROLES.COPILOT,
] as const

export const ALLOWED_DOWNLOAD_SUBMISSIONS_ROLES = [
    'administrator',
    PROJECT_ROLES.MANAGER,
    PROJECT_ROLES.COPILOT,
    PROJECT_ROLES.WRITE,
] as const
