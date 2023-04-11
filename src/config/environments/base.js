const TCA_WEBSITE = 'https://platform-ui.topcoder-dev.com';

module.exports = ({
    TOPCODER_COMMUNITY_WEBSITE_URL = 'https://www.topcoder-dev.com',
} = {}) => ({
    ANALYTICS: {
        SEGMENT_KEY: undefined,
        TAG_MANAGER_ID: undefined,
    },
    API: {
        FORUM_ACCESS_TOKEN: 'va.JApNvUOx3549h20I6tnl1kOQDc75NDIp.0jG3dA.EE3gZgV',
        FORUM_V2: 'https://vanilla.topcoder-dev.com/api/v2',
        V2: 'https://api.topcoder-dev.com/v2',
        V3: 'https://api.topcoder-dev.com/v3',
        V4: 'https://api.topcoder-dev.com/v4',
        V5: 'https://api.topcoder-dev.com/v5',
    },
    AUTH: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder-dev.com',
    },
    ENV: 'default',
    LOGGING: {
        PUBLIC_TOKEN: 'puba0825671e469d16f940c5a30dc738f11',
        SERVICE: 'platform-ui',
    },
    MEMBER_VERIFY_LOOKER: 3322,
    REACT_APP_ENABLE_TCA_CERT_MONETIZATION: process.env.REACT_APP_ENABLE_TCA_CERT_MONETIZATION || false,
    REAUTH_OFFSET: 55,
    SPRIG: {
        ENVIRONMENT_ID: 'bUcousVQ0-yF',
    },
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
        ACCOUNT_PROFILE: `${TOPCODER_COMMUNITY_WEBSITE_URL}/settings/profile`,
        ACCOUNT_SETTINGS: `${TOPCODER_COMMUNITY_WEBSITE_URL}/settings/account`,
        API_BASE: `${TOPCODER_COMMUNITY_WEBSITE_URL}/api`,
        BLOG_PAGE: `${TOPCODER_COMMUNITY_WEBSITE_URL}/blog`,
        CHALLENGES_PAGE: `${TOPCODER_COMMUNITY_WEBSITE_URL}/challenges`,
        GIGS_PAGE: `${TOPCODER_COMMUNITY_WEBSITE_URL}/gigs`,
        TCA: `${TCA_WEBSITE}`,
        THRIVE_PAGE: `${TOPCODER_COMMUNITY_WEBSITE_URL}/thrive`,
        USER_PROFILE: `${TOPCODER_COMMUNITY_WEBSITE_URL}/members`,
        WP_CONTENT: `${TOPCODER_COMMUNITY_WEBSITE_URL}/wp-content`,
    },
    UNIVERSAL_NAV: {
        URL: 'https://uni-nav.topcoder-dev.com/v1/tc-universal-nav.js',
    },
    TOPCODER_COMMUNITY_WEBSITE_URL,
    /**
     * URL of Topcoder Community Website
     */
    TERMS_URL:
      "https://www.topcoder-dev.com/challenges/terms/detail/317cd8f9-d66c-4f2a-8774-63c612d99cd4",
    PRIVACY_POLICY_URL: "https://www.topcoder-dev.com/policy",

    // TODO: move these to self-service
    SIGN_IN_URL: `https://accounts-auth0.topcoder-dev.com/?retUrl=https%3A%2F%2Fplatform-ui.topcoder-dev.com%2Fself-service%2Fwizard&regSource=selfService`,
    SIGN_UP_URL: `https://accounts-auth0.topcoder-dev.com/?retUrl=https%3A%2F%2Fplatform-ui.topcoder-dev.com%2Fself-service%2Fwizard&regSource=selfService&mode=signUp`,

    VANILLA_EMBED_JS: "https://vanilla.topcoder-dev.com/js/embed.js",
    VANILLA_EMBED_TYPE: "mfe",
    VANILLA_FORUM_API: "https://vanilla.topcoder-dev.com/api/v2",
    VANILLA_ACCESS_TOKEN: "va.JApNvUOx3549h20I6tnl1kOQDc75NDIp.0jG3dA.EE3gZgV",

    /**
     * Expire time period of auto saved intake form: 24 hours
     */
    AUTO_SAVED_COOKIE_EXPIRED_IN: 24 * 60,
    TIME_ZONE: "Europe/London",
});
