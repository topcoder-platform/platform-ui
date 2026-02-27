/**
 * Resource role id used to register challenge submitters.
 */
export const SUBMITTER_ROLE_ID = '732339e7-8e30-49d7-9198-cccf9451e221'

/**
 * Challenge statuses used by community challenge filters.
 */
export enum CHALLENGE_STATUS {
    Active = 'Active',
    Completed = 'Completed',
    Draft = 'Draft',
}

/**
 * Supported Thrive article types.
 */
export const THRIVE_ARTICLE_TYPES = ['Article', 'Video', 'Forum post'] as const

/**
 * Supported Thrive track keys.
 */
export const THRIVE_TRACK_KEYS = [
    'dataScience',
    'competitiveProgramming',
    'design',
    'development',
    'qualityAssurance',
    'topcoder',
] as const

/**
 * Max retry attempts when checking term agreement status.
 */
export const TERMS_CHECK_MAX_ATTEMPTS = 5

/**
 * Delay between term status retries in milliseconds.
 */
export const TERMS_CHECK_DELAY_MS = 5000

/**
 * Wipro email domain used for challenge registration checks.
 */
export const WIPRO_EMAIL_DOMAIN = '@wipro.com'

/**
 * External TopGear redirect url.
 */
export const TOPGEAR_REDIRECT_URL = 'https://topgear-app.wipro.com'
