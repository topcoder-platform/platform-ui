/* eslint-disable max-len */
import { EnvironmentConfigModel } from './environment-config.model'
import { EnvironmentConfigDefault } from './environment.default.config'

const COMMUNITY_WEBSITE: string = 'https://www.topcoder.com'
const TCA_WEBSITE: string = 'https://platform-ui.topcoder.com'

export const EnvironmentConfigProd: EnvironmentConfigModel = {
    ...EnvironmentConfigDefault,
    ANALYTICS: {
        SEGMENT_KEY: '8fCbi94o3ruUUGxRRGxWu194t6iVq9LH',
        TAG_MANAGER_ID: 'GTM-MXXQHG8',
    },
    API: {
        FORUM_ACCESS_TOKEN: EnvironmentConfigDefault.API.FORUM_ACCESS_TOKEN,
        FORUM_V2: 'https://discussions.topcoder.com/api/v2',
        V3: 'https://api.topcoder.com/v3',
        V4: 'https://api.topcoder.com/v4',
        V5: 'https://api.topcoder.com/v5',
    },
    AUTH: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder.com',
    },
    DISABLED_TOOLS: [],
    ENV: 'prod',
    SPRIG: {
        ENVIRONMENT_ID: 'a-IZBZ6-r7bU',
    },
    // TODO: Move stripe creds to .env file
    STRIPE: {
        ADMIN_TOKEN:
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiYWRtaW5pc3RyYXRvciJdLCJpc3MiOiJodHRwczovL2FwaS50b3Bjb2Rlci1kZXYuY29tIiwiaGFuZGxlIjoidGVzdDEiLCJleHAiOjI1NjMwNzY2ODksInVzZXJJZCI6IjQwMDUxMzMzIiwiaWF0IjoxNDYzMDc2MDg5LCJlbWFpbCI6InRlc3RAdG9wY29kZXIuY29tIiwianRpIjoiYjMzYjc3Y2QtYjUyZS00MGZlLTgzN2UtYmViOGUwYWU2YTRhIn0.wKWUe0-SaiFVN-VR_-GwgFlvWaDkSbc8H55ktb9LAVw',
        API_KEY: 'pk_live_m3bCBVSfkfMOEp3unZFRsHXi',
        API_VERSION: '2020-08-27',
        CUSTOMER_TOKEN:
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJ0ZXN0MSIsImV4cCI6MjU2MzA3NjY4OSwidXNlcklkIjoiNDAwNTEzMzMiLCJpYXQiOjE0NjMwNzYwODksImVtYWlsIjoidGVzdEB0b3Bjb2Rlci5jb20iLCJqdGkiOiJiMzNiNzdjZC1iNTJlLTQwZmUtODM3ZS1iZWI4ZTBhZTZhNGEifQ.jl6Lp_friVNwEP8nfsfmL-vrQFzOFp2IfM_HC7AwGcg',
    },
    TOPCODER_URLS: {
        ACCOUNT_PROFILE: `${COMMUNITY_WEBSITE}/settings/profile`,
        ACCOUNT_SETTINGS: `${COMMUNITY_WEBSITE}/settings/account`,
        API_BASE: `${COMMUNITY_WEBSITE}/api`,
        BLOG_PAGE: `${COMMUNITY_WEBSITE}/blog`,
        CHALLENGES_PAGE: `${COMMUNITY_WEBSITE}/challenges`,
        GIGS_PAGE: `${COMMUNITY_WEBSITE}/gigs`,
        TCA: `${TCA_WEBSITE}`,
        THRIVE_PAGE: `${COMMUNITY_WEBSITE}/thrive`,
        USER_PROFILE: `${COMMUNITY_WEBSITE}/members`,
        WP_CONTENT: `${COMMUNITY_WEBSITE}/wp-content`,
    },
    UNIVERSAL_NAV: {
        URL: 'https://uni-nav.topcoder.com/v1/tc-universal-nav.js',
    },
}
