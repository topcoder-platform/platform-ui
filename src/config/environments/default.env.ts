/* eslint-disable @typescript-eslint/typedef */
import { get } from 'lodash'

import { getReactEnv } from './react-env'
import type {
    LocalServiceOverride,
    SSOLoginProviderConfig,
} from './global-config.model'

function parseSSOLoginProviders(
    raw: string | undefined
): SSOLoginProviderConfig[] {
    if (!raw) {
        return []
    }

    try {
        const parsed = JSON.parse(raw) as SSOLoginProviderConfig[]
        return Array.isArray(parsed) ? parsed : []
    } catch (error) {
        // Swallow parsing issues and fall back to an empty list to keep boot resilient
        return []
    }
}

export const ENV = getReactEnv<'prod' | 'dev' | 'qa' | 'local'>(
    'HOST_ENV',
    'dev'
)

export const TC_DOMAIN: string = get(
    {
        dev: 'topcoder-dev.com',
        local: 'topcoder-dev.com',
        prod: 'topcoder.com',
        qa: 'topcoder-qa.com',
    },
    ENV,
    'topcoder.com'
)

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
    V6: `https://api.${TC_DOMAIN}/v6`,
}

export const STANDARDIZED_SKILLS_API = `${API.V5}/standardized-skills`
export const TC_FINANCE_API = `${API.V6}/finance`

export const AUTH = {
    ACCOUNTS_APP_CONNECTOR: `https://accounts-auth0.${TC_DOMAIN}`,
}

export const LOGGING = {
    PUBLIC_TOKEN: getReactEnv<string | undefined>(
        'DATADOG_PUBLIC_TOKEN',
        undefined
    ),
    SERVICE: 'platform-ui',
}

export const REAUTH_OFFSET = 55

export const SPRIG = {
    ENVIRONMENT_ID: getReactEnv<string | undefined>('SPRIG_ENV_ID', undefined),
}

export const VANILLA_FORUM = {
    V2_URL: 'https://vanilla.topcoder-dev.com/api/v2',
}

const ADMIN_SSO_LOGIN_PROVIDERS_ENV =
    '[{"ssoLoginProviderId":1,"name":"okta-customer","type":"samlp"}]'

export const ADMIN_SSO_LOGIN_PROVIDERS: SSOLoginProviderConfig[] =
    parseSSOLoginProviders(ADMIN_SSO_LOGIN_PROVIDERS_ENV)

export const LOCAL_SERVICE_OVERRIDES: LocalServiceOverride[] = []

export const STRIPE = {
    API_KEY: getReactEnv<string>('STRIPE_API_KEY', ''),
    API_VERSION: getReactEnv<string | undefined>(
        'STRIPE_API_VERSION',
        undefined
    ),
}

export const URLS = {
    ACCOUNT_SETTINGS: `https://account-settings.${TC_DOMAIN}/#account`,
    CHALLENGES_PAGE: `${TOPCODER_URL}/challenges`,
    UNIVERSAL_NAV: `https://uni-nav.${TC_DOMAIN}/v1/tc-universal-nav.js`,
    USER_PROFILE: `https://profiles.${TC_DOMAIN}`,
}

export const MEMBER_VERIFY_LOOKER = getReactEnv<number>(
    'MEMBER_VERIFY_LOOKER',
    3322
)

export const ENABLE_TCA_CERT_MONETIZATION = false

export const TERMS_URL =
    'https://www.topcoder-dev.com/challenges/terms/detail/317cd8f9-d66c-4f2a-8774-63c612d99cd4'
export const PRIVACY_POLICY_URL = `${TOPCODER_URL}/policy`

export const GAMIFICATION_ORG_ID = getReactEnv<string>(
    'GAMIFICATION_ORG_ID',
    undefined
)

// TODO: Revert this.  This was done because prod was restricting this and no one was available to fix the config
// export const RESTRICT_TALENT_SEARCH = getReactEnv<boolean>('RESTRICT_TALENT_SEARCH', false)
export const RESTRICT_TALENT_SEARCH = false

export const USERFLOW_SURVEYS = {
    ACCOUNT_SETTINGS: getReactEnv<string>(
        'USERFLOW_SURVEY_ACCOUNT_SETTINGS',
        '3e704fe0-dff4-4af4-abee-383ed162729e'
    ),
    PROFILES: getReactEnv<string>(
        'USERFLOW_SURVEY_PROFILES',
        '5cfae36f-0700-41c4-8938-0add4037acb2'
    ),
    TALENTSEARCH: getReactEnv<string>(
        'USERFLOW_SURVEY_TALENTSEARCH',
        'd1030c93-dd36-4ae0-b5d0-95004b8e9d32'
    ),
}

export const TROLLEY_WIDGET_ORIGIN = getReactEnv<string>(
    'TROLLEY_WIDGET_ORIGIN',
    'https://widget.trolley.com'
)

export const ADMIN = {
    AGREE_ELECTRONICALLY: '5b2798b2-ae82-4210-9b4d-5d6428125ccb',
    AGREE_FOR_DOCUSIGN_TEMPLATE: '999a26ad-b334-453c-8425-165d4cf496d7',
    AV_SCAN_SCORER_REVIEW_TYPE_ID: '68c5a381-c8ab-48af-92a7-7a869a4ee6c3',
    AVSCAN_TOPIC: 'avscan.action.scan',
    AWS_CLEAN_BUCKET: '',
    AWS_DMZ_BUCKET: 'topcoder-dev-submissions',
    AWS_QUARANTINE_BUCKET: '',
    AWS_REGION: 'us-east-1',
    CHALLENGE_URL: 'https://www.topcoder-dev.com/challenges',
    CONNECT_URL: 'https://connect.topcoder-dev.com',
    DEFAULT_PAYMENT_TERMS: 1,
    DIRECT_URL: 'https://www.topcoder-dev.com/direct',
    ONLINE_REVIEW_URL: 'https://software.topcoder-dev.com/review',
    SUBMISSION_SCAN_TOPIC: 'submission.scan.complete',
    WORK_MANAGER_URL: 'https://challenges.topcoder-dev.com',
}

const REVIEW_OPPORTUNITIES_URL_DEFAULT = getReactEnv<string>(
    'REVIEW_OPPORTUNITIES_URL',
    'https://www.topcoder-dev.com/challenges/?bucket=reviewOpportunities&' +
        'tracks[DS]=true&tracks[Des]=true&tracks[Dev]=true&tracks[QA]=true'
)

export const REVIEW = {
    CHALLENGE_PAGE_URL: 'https://www.topcoder-dev.com/challenges',
    OPPORTUNITIES_URL: REVIEW_OPPORTUNITIES_URL_DEFAULT,
    PROFILE_PAGE_URL: 'https://profiles.topcoder-dev.com/profiles',
}

const FILESTACK_SECURITY_POLICY = getReactEnv<string | undefined>(
    'FILESTACK_SECURITY_POLICY',
    undefined
)
const FILESTACK_SECURITY_SIGNATURE = getReactEnv<string | undefined>(
    'FILESTACK_SECURITY_SIGNATURE',
    undefined
)

export const FILESTACK = {
    API_KEY: getReactEnv<string>('FILESTACK_API_KEY', ''),
    CNAME: getReactEnv<string>('FILESTACK_CNAME', 'filestackapi.com'),
    CONTAINER: getReactEnv<string>(
        'FILESTACK_CONTAINER',
        'tc-challenge-v5-dev'
    ),
    PATH_PREFIX: getReactEnv<string>('FILESTACK_PATH_PREFIX', 'v6-review-app'),
    PROGRESS_INTERVAL: getReactEnv<number>(
        'FILESTACK_UPLOAD_PROGRESS_INTERVAL',
        100
    ),
    REGION: getReactEnv<string>('FILESTACK_REGION', 'us-east-1'),
    RETRY: getReactEnv<number>('FILESTACK_UPLOAD_RETRY', 2),
    SECURITY:
        FILESTACK_SECURITY_POLICY && FILESTACK_SECURITY_SIGNATURE
            ? {
                  POLICY: FILESTACK_SECURITY_POLICY,
                  SIGNATURE: FILESTACK_SECURITY_SIGNATURE,
              }
            : undefined,
    TIMEOUT: getReactEnv<number>('FILESTACK_UPLOAD_TIMEOUT', 30 * 60 * 1000),
}

export const SUBDOMAIN = window.location.hostname.split('.')[0]
