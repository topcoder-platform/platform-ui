/* eslint-disable @typescript-eslint/typedef */
import { get } from 'lodash'

import { getReactEnv } from './react-env'

export const ENV = getReactEnv<'prod' | 'dev' | 'qa'>('HOST_ENV', 'dev')

export const TC_DOMAIN: string = get({
    dev: 'topcoder-dev.com',
    prod: 'topcoder.com',
    qa: 'topcoder-qa.com',
}, ENV, 'topcoder.com')

export const TOPCODER_URL: string = `https://www.${TC_DOMAIN}`
export const PLATFORMUI_URL: string = `https://platform-ui.${TC_DOMAIN}`
export const USER_PROFILE_URL: string = `https://profiles.${TC_DOMAIN}`

export const API = {
    URL: `https://api.${TC_DOMAIN}`,
    V1: `https://api.${TC_DOMAIN}/v1`,
    V2: `https://api.${TC_DOMAIN}/v2`,
    V3: `https://api.${TC_DOMAIN}/v3`,
    V4: `https://api.${TC_DOMAIN}/v4`,
    V5: `https://api.${TC_DOMAIN}/v5`,
}

export const STANDARDIZED_SKILLS_API = `${API.V5}/standardized-skills`

export const AUTH = {
    ACCOUNTS_APP_CONNECTOR: `https://accounts-auth0.${TC_DOMAIN}`,
}

export const LOGGING = {
    PUBLIC_TOKEN: getReactEnv<string | undefined>('DATADOG_PUBLIC_TOKEN', undefined),
    SERVICE: 'platform-ui',
}

export const REAUTH_OFFSET = 55

export const SPRIG = { ENVIRONMENT_ID: getReactEnv<string | undefined>('SPRIG_ENV_ID', undefined) }

export const VANILLA_FORUM = {
    V2_URL: 'https://vanilla.topcoder-dev.com/api/v2',
}

export const STRIPE = {
    API_KEY: getReactEnv<string>('STRIPE_API_KEY', ''),
    API_VERSION: getReactEnv<string | undefined>('STRIPE_API_VERSION', undefined),
}

export const URLS = {
    ACCOUNT_SETTINGS: `https://account-settings.${TC_DOMAIN}/#account`,
    CHALLENGES_PAGE: `${TOPCODER_URL}/challenges`,
    UNIVERSAL_NAV: `https://uni-nav.${TC_DOMAIN}/v1/tc-universal-nav.js`,
    USER_PROFILE: `https://profiles.${TC_DOMAIN}`,
}

export const MEMBER_VERIFY_LOOKER = getReactEnv<number>('MEMBER_VERIFY_LOOKER', 3322)

export const ENABLE_TCA_CERT_MONETIZATION = false

export const TERMS_URL = 'https://www.topcoder-dev.com/challenges/terms/detail/317cd8f9-d66c-4f2a-8774-63c612d99cd4'
export const PRIVACY_POLICY_URL = `${TOPCODER_URL}/policy`

export const SUBDOMAIN = window.location.hostname.split('.')[0]

export const GAMIFICATION_ORG_ID = getReactEnv<string>('GAMIFICATION_ORG_ID', undefined)

// TODO: Revert this.  This was done because prod was restricting this and no one was available to fix the config
// export const RESTRICT_TALENT_SEARCH = getReactEnv<boolean>('RESTRICT_TALENT_SEARCH', false)
export const RESTRICT_TALENT_SEARCH = false

export const USERFLOW_SURVEYS = {
    ACCOUNT_SETTINGS: getReactEnv<string>('USERFLOW_SURVEY_ACCOUNT_SETTINGS', '3e704fe0-dff4-4af4-abee-383ed162729e'),
    PROFILES: getReactEnv<string>('USERFLOW_SURVEY_PROFILES', '5cfae36f-0700-41c4-8938-0add4037acb2'),
    TALENTSEARCH: getReactEnv<string>('USERFLOW_SURVEY_TALENTSEARCH', 'd1030c93-dd36-4ae0-b5d0-95004b8e9d32'),
}

export const ADMIN = {
    CHALLENGE_URL: 'https://www.topcoder-dev.com/challenges',
    CONNECT_URL: 'https://connect.topcoder-dev.com',
    DIRECT_URL: 'https://www.topcoder-dev.com/direct',
    ONLINE_REVIEW_URL: 'https://software.topcoder-dev.com/review',
    WORK_MANAGER_URL: 'https://challenges.topcoder-dev.com',
}
