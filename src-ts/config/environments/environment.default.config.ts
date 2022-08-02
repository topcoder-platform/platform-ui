import { GlobalConfig } from '../../lib'

import { AppHostEnvironment } from './app-host-environment.enum'

const COMMUNITY_WEBSITE: string = 'https://www.topcoder-dev.com'

export const EnvironmentConfigDefault: GlobalConfig = {
    ANALYTICS: {
        SEGMENT_KEY: undefined,
        TAG_MANAGER_ID: undefined,
    },
    API: {
        FORUM_ACCESS_TOKEN: 'va.JApNvUOx3549h20I6tnl1kOQDc75NDIp.0jG3dA.EE3gZgV',
        FORUM_V2: 'https://vanilla.topcoder-dev.com/api/v2',
        V3: 'https://api.topcoder-dev.com/v3',
        V5: 'https://api.topcoder-dev.com/v5',
    },
    ENV: AppHostEnvironment.default,
    LEARN_SRC: 'https://fcc.topcoder-dev.com:4431',
    LOGGING: {
        PUBLIC_TOKEN: 'puba0825671e469d16f940c5a30dc738f11',
        SERVICE: 'platform-ui',
    },
    REAUTH_OFFSET: 55,
    // TODO: Move stripe creds to .env file
    STRIPE: {
        ADMIN_TOKEN:
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiYWRtaW5pc3RyYXRvciJdLCJpc3MiOiJodHRwczovL2FwaS50b3Bjb2Rlci1kZXYuY29tIiwiaGFuZGxlIjoidGVzdDEiLCJleHAiOjI1NjMwNzY2ODksInVzZXJJZCI6IjQwMDUxMzMzIiwiaWF0IjoxNDYzMDc2MDg5LCJlbWFpbCI6InRlc3RAdG9wY29kZXIuY29tIiwianRpIjoiYjMzYjc3Y2QtYjUyZS00MGZlLTgzN2UtYmViOGUwYWU2YTRhIn0.wKWUe0-SaiFVN-VR_-GwgFlvWaDkSbc8H55ktb9LAVw',
        API_KEY: 'pk_test_rfcS49MHRVUKomQ9JgSH7Xqz',
        API_VERSION: '2020-08-27',
        CUSTOMER_TOKEN:
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJ0ZXN0MSIsImV4cCI6MjU2MzA3NjY4OSwidXNlcklkIjoiNDAwNTEzMzMiLCJpYXQiOjE0NjMwNzYwODksImVtYWlsIjoidGVzdEB0b3Bjb2Rlci5jb20iLCJqdGkiOiJiMzNiNzdjZC1iNTJlLTQwZmUtODM3ZS1iZWI4ZTBhZTZhNGEifQ.jl6Lp_friVNwEP8nfsfmL-vrQFzOFp2IfM_HC7AwGcg',
    },
    TOPCODER_URLS: {
        API_BASE: `${COMMUNITY_WEBSITE}/api`,
        BLOG_PAGE: `${COMMUNITY_WEBSITE}/blog`,
        CHALLENGES_PAGE: `${COMMUNITY_WEBSITE}/challenges`,
        GIGS_PAGE: `${COMMUNITY_WEBSITE}/gigs`,
        THRIVE_PAGE: `${COMMUNITY_WEBSITE}/thrive`,
        USER_PROFILE: `${COMMUNITY_WEBSITE}/members`,
        WP_CONTENT: `${COMMUNITY_WEBSITE}/wp-content`,
    },
    URL: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder-dev.com',
    },
}
