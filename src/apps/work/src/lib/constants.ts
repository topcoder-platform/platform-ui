import { EnvironmentConfig } from '~/config'

export const WORK_APP_BODY_CLASS = 'work-app'

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

export const PAGE_SIZE = 10

export const PAGINATION_PER_PAGE_OPTIONS: ReadonlyArray<number> = [5, 10, 25, 50]

export const CHALLENGE_TRACKS = {
    COMPETITIVE_PROGRAMMING: 'COMPETITIVE_PROGRAMMING',
    DATA_SCIENCE: 'DATA_SCIENCE',
    DESIGN: 'DESIGN',
    DEVELOP: 'DEVELOP',
    QA: 'QA',
} as const

export const PHASE_STATUS = {
    CLOSED: 'Closed',
    OPEN: 'Open',
    SCHEDULED: 'Scheduled',
} as const

export const CHALLENGE_API_URL = process.env.REACT_APP_CHALLENGE_API_URL
    || process.env.CHALLENGE_API_URL
    || EnvironmentConfig.CHALLENGE_API_URL
    || `${EnvironmentConfig.API.V5}/challenges`

export const ENGAGEMENTS_API_URL = process.env.REACT_APP_ENGAGEMENTS_API_URL
    || process.env.ENGAGEMENTS_API_URL
    || `${EnvironmentConfig.API.V6}/engagements/engagements`

export const ENGAGEMENTS_ROOT_API_URL = process.env.REACT_APP_ENGAGEMENTS_ROOT_API_URL
    || process.env.ENGAGEMENTS_ROOT_API_URL
    || `${EnvironmentConfig.API.V6}/engagements`

export const APPLICATIONS_API_URL = process.env.REACT_APP_APPLICATIONS_API_URL
    || process.env.APPLICATIONS_API_URL
    || `${EnvironmentConfig.API.V6}/engagements/applications`

export const TC_FINANCE_API_URL = process.env.REACT_APP_TC_FINANCE_API_URL
    || process.env.TC_FINANCE_API_URL
    || EnvironmentConfig.TC_FINANCE_API

export const ENGAGEMENTS_APP_URL = process.env.REACT_APP_ENGAGEMENTS_APP_URL
    || process.env.ENGAGEMENTS_APP_URL
    || EnvironmentConfig.ENGAGEMENTS_URL

export const CHALLENGE_API_VERSION = process.env.REACT_APP_CHALLENGE_API_VERSION
    || process.env.CHALLENGE_API_VERSION
    || EnvironmentConfig.CHALLENGE_API_VERSION
    || 'v5'

export const CHALLENGE_TYPES_API_URL = process.env.REACT_APP_CHALLENGE_TYPES_API_URL
    || process.env.CHALLENGE_TYPES_API_URL
    || `${EnvironmentConfig.API.V6}/challenge-types`

export const CHALLENGE_DEFAULT_REVIEWERS_URL = process.env.REACT_APP_CHALLENGE_DEFAULT_REVIEWERS_URL
    || process.env.CHALLENGE_DEFAULT_REVIEWERS_URL
    || `${CHALLENGE_API_URL.replace(/\/challenges$/, '')}/challenge/default-reviewers`

export const CHALLENGE_TRACKS_API_URL = process.env.REACT_APP_CHALLENGE_TRACKS_API_URL
    || process.env.CHALLENGE_TRACKS_API_URL
    || `${EnvironmentConfig.API.V5}/challenge-tracks`

export const REVIEW_TYPE_API_URL = process.env.REACT_APP_REVIEW_TYPE_API_URL
    || process.env.REVIEW_TYPE_API_URL
    || `${EnvironmentConfig.API.V6}/reviewTypes`

export const SCORECARDS_API_URL = process.env.REACT_APP_SCORECARDS_API_URL
    || process.env.SCORECARDS_API_URL
    || `${EnvironmentConfig.API.V6}/scorecards`

export const WORKFLOWS_API_URL = process.env.REACT_APP_WORKFLOWS_API_URL
    || process.env.WORKFLOWS_API_URL
    || `${EnvironmentConfig.API.V6}/workflows`

export const GROUPS_API_URL = process.env.REACT_APP_GROUPS_API_URL
    || process.env.GROUPS_API_URL
    || `${EnvironmentConfig.API.V5}/groups`

export const TERMS_API_URL = process.env.REACT_APP_TERMS_API_URL
    || process.env.TERMS_API_URL
    || `${EnvironmentConfig.API.V5}/terms`

const DEFAULT_NDA_UUID_FROM_CONFIG = (EnvironmentConfig as unknown as Record<string, unknown>)
    .DEFAULT_NDA_UUID

export const DEFAULT_NDA_UUID = process.env.REACT_APP_DEFAULT_NDA_UUID
    || process.env.DEFAULT_NDA_UUID
    || (
        typeof DEFAULT_NDA_UUID_FROM_CONFIG === 'string'
            ? DEFAULT_NDA_UUID_FROM_CONFIG
            : undefined
    )
    || '21193'

export const RESOURCES_API_URL = process.env.REACT_APP_RESOURCES_API_URL
    || process.env.RESOURCES_API_URL
    || `${EnvironmentConfig.API.V6}/resources`

export const REVIEWS_API_URL = process.env.REACT_APP_REVIEWS_API_URL
    || process.env.REVIEWS_API_URL
    || `${EnvironmentConfig.API.V6}/reviews`

export const MEMBER_API_URL = process.env.REACT_APP_MEMBER_API_URL
    || process.env.MEMBER_API_URL
    || `${EnvironmentConfig.API.V5}/members`

export const RESOURCE_ROLES_API_URL = process.env.REACT_APP_RESOURCE_ROLES_API_URL
    || process.env.RESOURCE_ROLES_API_URL
    || `${EnvironmentConfig.API.V6}/resource-roles`

export const SUBMISSIONS_API_URL = process.env.REACT_APP_SUBMISSIONS_API_URL
    || process.env.SUBMISSIONS_API_URL
    || `${EnvironmentConfig.API.V6}/submissions`

export const COMMUNITY_APP_URL = process.env.REACT_APP_COMMUNITY_APP_URL
    || process.env.COMMUNITY_APP_URL
    || EnvironmentConfig.COMMUNITY_APP_URL
    || EnvironmentConfig.TOPCODER_URL

export const PROFILE_URL = `${COMMUNITY_APP_URL}/members`

export const REVIEW_APP_URL = process.env.REACT_APP_REVIEW_APP_URL
    || process.env.REVIEW_APP_URL
    || EnvironmentConfig.REVIEW_APP_URL
    || EnvironmentConfig.ADMIN.REVIEW_UI_URL

export const DIRECT_PROJECT_URL = process.env.REACT_APP_DIRECT_PROJECT_URL
    || process.env.DIRECT_PROJECT_URL
    || EnvironmentConfig.DIRECT_PROJECT_URL
    || EnvironmentConfig.ADMIN.DIRECT_URL

export const PROJECTS_API_URL = process.env.REACT_APP_PROJECTS_API_URL
    || process.env.PROJECTS_API_URL
    || process.env.PROJECT_API_URL
    || `${EnvironmentConfig.API.V5}/projects`

export const SKILLS_V5_SKILLS_URL = process.env.REACT_APP_SKILLS_V5_SKILLS_URL
    || process.env.SKILLS_V5_SKILLS_URL
    || `${EnvironmentConfig.API.V5}/standardized-skills/skills`

export const UPDATE_SKILLS_V5_API_URL = process.env.REACT_APP_UPDATE_SKILLS_V5_API_URL
    || process.env.UPDATE_SKILLS_V5_API_URL
    || `${EnvironmentConfig.API.V5}/standardized-skills/challenge-skills`

export const FILE_PICKER_SUBMISSION_CONTAINER_NAME = process.env.REACT_APP_FILE_PICKER_SUBMISSION_CONTAINER_NAME
    || process.env.FILE_PICKER_SUBMISSION_CONTAINER_NAME
    || 'submission-staging-dev'

export const PROJECT_ATTACHMENTS_FOLDER = process.env.REACT_APP_PROJECT_ATTACHMENTS_FOLDER
    || process.env.PROJECT_ATTACHMENTS_FOLDER
    || 'PROJECT_ATTACHMENTS'

export const ATTACHMENT_TYPE_FILE = 'file'
export const ATTACHMENT_TYPE_LINK = 'link'

export const GENERIC_PROJECT_MILESTONE_PRODUCT_TYPE = 'generic-product'
export const GENERIC_PROJECT_MILESTONE_PRODUCT_NAME = 'Generic Product'
export const PHASE_PRODUCT_TEMPLATE_ID = 67
export const PHASE_PRODUCT_CHALLENGE_ID_FIELD = 'details.challengeGuid'

export const BETA_MODE_COOKIE_TAG = 'beta-mode'

export const PROJECT_ROLES = {
    COPILOT: 'copilot',
    CUSTOMER: 'customer',
    MANAGER: 'manager',
    READ: 'observer',
    WRITE: 'customer',
} as const

export const PROJECT_STATUSES = [
    { label: 'Draft', value: 'draft' },
    { label: 'Active', value: 'active' },
    { label: 'In Review', value: 'in_review' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Paused', value: 'paused' },
] as const

export const PROJECT_STATUS = {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    DRAFT: 'draft',
    IN_REVIEW: 'in_review',
    PAUSED: 'paused',
    REVIEWED: 'reviewed',
} as const

export const PROJECTS_PAGE_SIZE = 20

export const PROJECT_TYPE_TAAS = 'talent-as-a-service'

export const JOB_ROLE_OPTIONS = [
    { label: 'Designer', value: 'designer' },
    { label: 'Software Developer', value: 'software-developer' },
    { label: 'Data Scientist', value: 'data-scientist' },
    { label: 'Data Engineer', value: 'data-engineer' },
] as const

export const JOB_WORKLOAD_OPTIONS = [
    { label: 'Full-Time', value: 'fulltime' },
    { label: 'Fractional', value: 'fractional' },
] as const

export const TAAS_PAGE_SIZE = 20

export const ALLOWED_DOWNLOAD_SUBMISSIONS_ROLES = [
    'administrator',
    PROJECT_ROLES.MANAGER,
    PROJECT_ROLES.COPILOT,
    PROJECT_ROLES.WRITE,
]

export const ENGAGEMENT_STATUSES = [
    'Open',
    'Pending Assignment',
    'Active',
    'Cancelled',
    'Closed',
] as const

export const ENGAGEMENT_ROLES = ['FULL_TIME', 'PART_TIME', 'CONTRACT'] as const

export const ENGAGEMENT_WORKLOADS = ['FULL_TIME', 'PART_TIME'] as const

export const ANTICIPATED_START_OPTIONS = ['IMMEDIATE', 'FEW_DAYS', 'FEW_WEEKS'] as const

export const APPLICATION_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'SELECTED', 'REJECTED'] as const

export const ASSIGNMENT_STATUSES = ['ASSIGNED', 'ACTIVE', 'TERMINATED'] as const
