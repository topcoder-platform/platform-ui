module.exports = {
  /**
   * URL of Topcoder Community Website
   */
  TOPCODER_COMMUNITY_WEBSITE_URL: "https://topcoder-dev.com",
  TERMS_URL:
    "https://www.topcoder-dev.com/challenges/terms/detail/317cd8f9-d66c-4f2a-8774-63c612d99cd4",
  PRIVACY_POLICY_URL: "https://www.topcoder-dev.com/policy",
  SIGN_IN_URL: `https://accounts-auth0.topcoder-dev.com/?retUrl=https%3A%2F%2Fplatform-ui.topcoder-dev.com%2Fself-service%2Fwizard&regSource=selfService`,
  SIGN_UP_URL: `https://accounts-auth0.topcoder-dev.com/?retUrl=https%3A%2F%2Fplatform-ui.topcoder-dev.com%2Fself-service%2Fwizard&regSource=selfService&mode=signUp`,
  /**
   * URL of Topcoder Connect Website
   */
  CONNECT_WEBSITE_URL: "https://connect.topcoder-dev.com",
  VANILLA_EMBED_JS: "https://vanilla.topcoder-dev.com/js/embed.js",
  VANILLA_EMBED_TYPE: "mfe",
  VANILLA_FORUM_API: "https://vanilla.topcoder-dev.com/api/v2",
  VANILLA_ACCESS_TOKEN: "va.JApNvUOx3549h20I6tnl1kOQDc75NDIp.0jG3dA.EE3gZgV",

  API: {
    V5: "https://api.topcoder-dev.com/v5",
    V3: "https://api.topcoder-dev.com/v3",
  },

  STRIPE: {
    API_KEY: "pk_test_rfcS49MHRVUKomQ9JgSH7Xqz",
    API_VERSION: "2020-08-27",
    CUSTOMER_TOKEN:
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJ0ZXN0MSIsImV4cCI6MjU2MzA3NjY4OSwidXNlcklkIjoiNDAwNTEzMzMiLCJpYXQiOjE0NjMwNzYwODksImVtYWlsIjoidGVzdEB0b3Bjb2Rlci5jb20iLCJqdGkiOiJiMzNiNzdjZC1iNTJlLTQwZmUtODM3ZS1iZWI4ZTBhZTZhNGEifQ.jl6Lp_friVNwEP8nfsfmL-vrQFzOFp2IfM_HC7AwGcg",
    ADMIN_TOKEN:
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiYWRtaW5pc3RyYXRvciJdLCJpc3MiOiJodHRwczovL2FwaS50b3Bjb2Rlci1kZXYuY29tIiwiaGFuZGxlIjoidGVzdDEiLCJleHAiOjI1NjMwNzY2ODksInVzZXJJZCI6IjQwMDUxMzMzIiwiaWF0IjoxNDYzMDc2MDg5LCJlbWFpbCI6InRlc3RAdG9wY29kZXIuY29tIiwianRpIjoiYjMzYjc3Y2QtYjUyZS00MGZlLTgzN2UtYmViOGUwYWU2YTRhIn0.wKWUe0-SaiFVN-VR_-GwgFlvWaDkSbc8H55ktb9LAVw",
  },
  /**
   * Expire time period of auto saved intake form: 24 hours
   */
  AUTO_SAVED_COOKIE_EXPIRED_IN: 24 * 60,
  TIME_ZONE: "Europe/London",

  //----------------------------- Imported from gigs app  TODO: Clean these up -----------------------------------

  GUIKIT: {
    DEBOUNCE_ON_CHANGE_TIME: 150,
  },
  API: {
    V5: process.env.API_V5 || "https://api.topcoder-dev.com/v5",
    V3: process.env.API_V3 || "https://api.topcoder-dev.com/v3",
  },
  URL: {
    AUTH: process.env.URL_AUTH || "https://accounts-auth0.topcoder-dev.com",
    BASE: process.env.URL_BASE || "https://local.topcoder-dev.com",
    COMMUNITY_APP:
      process.env.URL_COMMUNITY_APP || "https://community-app.topcoder-dev.com",
    DISCUSSIONS:
      process.env.URL_DISCUSSIONS || "https://discussions.topcoder.com",
    PLATFORM_WEBSITE_URL:
      process.env.URL_PLATFORM_WEBSITE_URL ||
      "https://platform.topcoder-dev.com",
  },
  PROXY_API: process.env.PROXY_API || "https://platform.topcoder-dev.com",
  RECRUIT_API: process.env.RECRUIT_API || "https://www.topcoder-dev.com",
  // the server api base path
  API_BASE_PATH: process.env.API_BASE_PATH || "/gigs-app/api/my-gigs",
  // the log level, default is 'debug'
  LOG_LEVEL: process.env.LOG_LEVEL || "error",
  // The authorization secret used during token verification.
  AUTH_SECRET: process.env.AUTH_SECRET,
  // The valid issuer of tokens, a json array contains valid issuer.
  VALID_ISSUERS: process.env.VALID_ISSUERS,
  // Auth0 URL, used to get TC M2M token
  AUTH0_URL: process.env.AUTH0_URL,
  // Auth0 audience, used to get TC M2M token
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  // Auth0 client id, used to get TC M2M token
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  // Auth0 client secret, used to get TC M2M token
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  // Proxy Auth0 URL, used to get TC M2M token
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,
  CHALLENGE_LIST_PATH:
    process.env.CHALLENGE_LIST_PATH || "/earn/find/challenges",
  GIG_LIST_PATH: process.env.GIG_LIST_PATH || "/earn/gigs",
  GROWSURF_COOKIE: "_tc_gigs_ref",
  GROWSURF_COOKIE_SETTINGS: {
    secure: true,
    domain: "",
    expires: 30, // days
  },
  APPLIED_GIGS: "_applied_gigs",
  m2m: {
    M2M_AUDIT_USER_ID: process.env.M2M_AUDIT_USER_ID,
    M2M_AUDIT_HANDLE: process.env.M2M_AUDIT_HANDLE,
  },
  MOCK_API_PORT: process.env.MOCK_API_PORT || 4000,
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || [
    "pdf",
    "doc",
    "docx",
    "txt",
  ],
  MAX_ALLOWED_FILE_SIZE_MB: process.env.MAX_ALLOWED_FILE_SIZE_MB || 10,
  HEAP_ANALYTICS_KEY: process.env.HEAP_ANALYTICS_KEY || "428520820",

};
