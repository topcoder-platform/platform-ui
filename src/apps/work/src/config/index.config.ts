export const CHALLENGE_TRACKS = {
    COMPETITIVE_PROGRAMMING: 'COMPETITIVE_PROGRAMMING',
    DATA_SCIENCE: 'DATA_SCIENCE',
    DESIGN: 'DESIGN',
    DEVELOP: 'DEVELOP',
    QA: 'QA',
} as const

export const CHALLENGE_TYPES = {
    CHALLENGE: 'Challenge',
    FIRST_2_FINISH: 'First2Finish',
    MARATHON_MATCH: 'Marathon Match',
    TASK: 'Task',
} as const

export const CHALLENGE_STATUS = {
    ACTIVE: 'ACTIVE',
    APPROVED: 'APPROVED',
    CANCELLED: 'CANCELLED',
    CANCELLED_CLIENT_REQUEST: 'CANCELLED_CLIENT_REQUEST',
    CANCELLED_FAILED_REVIEW: 'CANCELLED_FAILED_REVIEW',
    CANCELLED_FAILED_SCREENING: 'CANCELLED_FAILED_SCREENING',
    CANCELLED_REQUIREMENTS_INFEASIBLE: 'CANCELLED_REQUIREMENTS_INFEASIBLE',
    CANCELLED_WINNER_UNRESPONSIVE: 'CANCELLED_WINNER_UNRESPONSIVE',
    CANCELLED_ZERO_REGISTRATIONS: 'CANCELLED_ZERO_REGISTRATIONS',
    CANCELLED_ZERO_SUBMISSIONS: 'CANCELLED_ZERO_SUBMISSIONS',
    COMPLETED: 'COMPLETED',
    DRAFT: 'DRAFT',
    NEW: 'NEW',
} as const

export const READ_ONLY = 'topcoder user'
export const ADMIN = 'administrator'
export const CONNECT_ADMIN = 'connect admin'
export const COPILOT = 'copilot'
export const MANAGER = 'manager'
export const PROJECT_MANAGER = 'project manager'
export const TOPCODER_PROJECT_MANAGER = 'topcoder project manager'
export const TALENT_MANAGER = 'talent manager'
export const TOPCODER_TALENT_MANAGER = 'topcoder talent manager'
export const TASK_MANAGER = 'task manager'
export const TOPCODER_TASK_MANAGER = 'topcoder task manager'

export const READ_ONLY_ROLES = [READ_ONLY]
export const ADMIN_ROLES = [ADMIN, CONNECT_ADMIN]
export const COPILOT_ROLES = [COPILOT]
export const MANAGER_ROLES = [
    PROJECT_MANAGER,
    TOPCODER_PROJECT_MANAGER,
    TALENT_MANAGER,
    TOPCODER_TALENT_MANAGER,
]
export const TASK_MANAGER_ROLES = [
    TASK_MANAGER,
    TOPCODER_TASK_MANAGER,
    TALENT_MANAGER,
    TOPCODER_TALENT_MANAGER,
]

export const DEFAULT_PAGE_SIZE = 10
export const PROJECTS_PAGE_SIZE = 20
export const ENGAGEMENTS_PAGE_SIZE = 20
export const TABLE_DATE_FORMAT = 'MMM DD YYYY, HH:mm A'

export const PAGINATION_PER_PAGE_OPTIONS = [
    { label: '5', value: '5' },
    { label: '10', value: '10' },
    { label: '25', value: '25' },
    { label: '50', value: '50' },
]
