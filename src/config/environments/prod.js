const baseConfig = require('./base')

module.exports = {
  ...baseConfig({
    TOPCODER_COMMUNITY_WEBSITE_URL: 'https://topcoder.com',
  }),

  TERMS_URL: "https://www.topcoder.com/challenges/terms/detail/564a981e-6840-4a5c-894e-d5ad22e9cd6f",
  PRIVACY_POLICY_URL: "https://www.topcoder.com/policy",

  // TODO: move these 2 to self-service
  SIGN_IN_URL: `https://accounts-auth0.topcoder.com/?retUrl=https%3A%2F%2Fplatform-ui.topcoder.com%2Fself-service%2Fwizard&regSource=selfService`,
  SIGN_UP_URL: `https://accounts-auth0.topcoder.com/?retUrl=https%3A%2F%2Fplatform-ui.topcoder.com%2Fself-service%2Fwizard&regSource=selfService&mode=signUp`,

  VANILLA_EMBED_JS: "https://discussions.topcoder.com/js/embed.js",
  VANILLA_FORUM_API: "https://vanilla.topcoder.com/api/v2",

  API: {
    V5: "https://api.topcoder.com/v5",
    V4: "https://api.topcoder.com/v4",
    V3: "https://api.topcoder.com/v3",
    V2: "https://api.topcoder.com/v2",
  },

  STRIPE: {
    API_KEY: "pk_live_m3bCBVSfkfMOEp3unZFRsHXi",
    API_VERSION: "2020-08-27",
    CUSTOMER_TOKEN:
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJ0ZXN0MSIsImV4cCI6MjU2MzA3NjY4OSwidXNlcklkIjoiNDAwNTEzMzMiLCJpYXQiOjE0NjMwNzYwODksImVtYWlsIjoidGVzdEB0b3Bjb2Rlci5jb20iLCJqdGkiOiJiMzNiNzdjZC1iNTJlLTQwZmUtODM3ZS1iZWI4ZTBhZTZhNGEifQ.jl6Lp_friVNwEP8nfsfmL-vrQFzOFp2IfM_HC7AwGcg",
    ADMIN_TOKEN:
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiYWRtaW5pc3RyYXRvciJdLCJpc3MiOiJodHRwczovL2FwaS50b3Bjb2Rlci1kZXYuY29tIiwiaGFuZGxlIjoidGVzdDEiLCJleHAiOjI1NjMwNzY2ODksInVzZXJJZCI6IjQwMDUxMzMzIiwiaWF0IjoxNDYzMDc2MDg5LCJlbWFpbCI6InRlc3RAdG9wY29kZXIuY29tIiwianRpIjoiYjMzYjc3Y2QtYjUyZS00MGZlLTgzN2UtYmViOGUwYWU2YTRhIn0.wKWUe0-SaiFVN-VR_-GwgFlvWaDkSbc8H55ktb9LAVw",
  },
};
