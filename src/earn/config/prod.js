module.exports = {
  GUIKIT: {
    DEBOUNCE_ON_CHANGE_TIME: 150,
  },
  /**
   * URL of Topcoder Community Website
   */
  TOPCODER_COMMUNITY_WEBSITE_URL: "https://topcoder.com",

  /* Max number of recommended challenges */
  CHALLENGE_DETAILS_MAX_NUMBER_RECOMMENDED_CHALLENGES: 3,
  /**
   * URL of Topcoder Connect Website
   */
  SERVER_API_KEY: "aa9ccf36-3936-450c-9983-097ddba51bef",
  CONNECT_WEBSITE_URL: "https://connect.topcoder.com",

  URL: {
    ARENA: "https://arena.topcoder.com",
    APP: "https://community-app.topcoder.com",

    /* This is the same value as above, but it is used by topcoder-react-lib,
     * as a more verbose name for the param. */
    COMMUNITY_APP: "https://community-app.topcoder.com",

    PLATFORM_WEBSITE: "https://platform.topcoder.com",
    AUTH: "https://accounts-auth0.topcoder.com",
    BASE: "https://www.topcoder.com",
    HOME: "/my-dashboard",
    BLOG: "https://www.topcoder.com/blog",
    BLOG_FEED: "https://www.topcoder.com/blog/feed/",

    COMMUNITY: "https://community.topcoder.com",
    FORUMS: "https://apps.topcoder.com/forums",
    FORUMS_VANILLA: "https://discussions.topcoder.com",
    HELP:
      "https://www.topcoder.com/thrive/tracks?track=Topcoder&tax=Help%20Articles",
    SUBMISSION_REVIEW: "https://submission-review.topcoder.com",

    THRIVE: "https://www.topcoder.com/thrive",

    MEMBER: "https://member.topcoder.com",
    ONLINE_REVIEW: "https://software.topcoder.com",
    PAYMENT_TOOL: "https://payment.topcoder.com",
    STUDIO: "https://studio.topcoder.com",
    IOS: "https://ios.topcoder.com",

    /* Connector URL of the TC accounts App. */
    ACCOUNTS_APP_CONNECTOR: "https://accounts-auth0.topcoder.com/",

    TCO: "https://www.topcoder.com/tco",
    TCO17: "https://tco17.topcoder.com/",
    TCO19: "https://tco19.topcoder.com/",
    WIPRO: "https://wipro.topcoder.com",

    TOPGEAR: "https://topgear-app.wipro.com",

    COMMUNITY_API: "http://localhost:8000",
    COMMUNITY_APP_GITHUB_ISSUES:
      "https://github.com/topcoder-platform/community-app/issues",
    COMMUNITIES: {
      BLOCKCHAIN: "https://blockchain.topcoder.com",
      COGNITIVE: "https://cognitive.topcoder.com",
      ZURICH: "https://zurich.topcoder.com",
      COMCAST: "https://comcast.topcoder.com",
      CS: "https://cs.topcoder.com",
    },

    INFO: {
      DESIGN_CHALLENGES:
        "http://help.topcoder.com/hc/en-us/categories/202610437-DESIGN",
      DESIGN_CHALLENGE_CHECKPOINTS:
        "https://help.topcoder.com/hc/en-us/articles/219240807-Multi-Round-Checkpoint-Design-Challenges",
      DESIGN_CHALLENGE_SUBMISSION:
        "http://help.topcoder.com/hc/en-us/articles/219122667-Formatting-Your-Submission-for-Design-Challenges",
      DESIGN_CHALLENGE_TYPES:
        "http://help.topcoder.com/hc/en-us/articles/217481388-Choosing-a-Design-Challenge",
      RELIABILITY_RATINGS_AND_BONUSES:
        "https://www.topcoder.com/thrive/articles/Development%20Reliability%20Ratings%20and%20Bonuses",
      STOCK_ART_POLICY:
        "http://help.topcoder.com/hc/en-us/articles/217481408-Policy-for-Stock-Artwork-in-Design-Submissions",
      STUDIO_FONTS_POLICY:
        "http://help.topcoder.com/hc/en-us/articles/217959447-Font-Policy-for-Design-Challenges",
      TOPCODER_TERMS: "https://www.topcoder.com/community/how-it-works/terms/",
      HOWTOCOMPETEINMARATHON:
        "https://www.topcoder.com/thrive/articles/How%20To%20Compete%20in%20a%20Marathon%20Match",
      USABLECODEDEV:
        "https://www.topcoder.com/thrive/articles/Usable%20Code%20in%20Dev%20Challenges",
      EXTENSIONVSCODE:
        "https://marketplace.visualstudio.com/items?itemName=Topcoder.topcoder-workflow&ssr=false#overview",
      TEMPLATES_REPO: "https://github.com/topcoder-platform-templates",
    },

    USER_SETTINGS: "https://lc1-user-settings-service.herokuapp.com",
    EMAIL_VERIFY_URL: "http://www.topcoder.com/settings/account/changeEmail",
    ABANDONMENT_EMBED:
      "https://43d132d5dbff47c59d9d53ad448f93c2.js.ubembed.com",
    SUBDOMAIN_PROFILE_CONFIG: [
      {
        groupId: "20000000",
        communityId: "wipro",
        communityName: "topgear",
        userProfile: "https://topgear-app.wipro.com/user-details",
      },
    ],
  },

  // Config for TC EDU - THRIVE
  TC_EDU_BASE_PATH: "/thrive",
  TC_EDU_ARTICLES_PATH: "/articles",
  ENABLE_RECOMMENDER: true,

  API: {
    V5: "https://api.topcoder.com/v5",
    V4: "https://api.topcoder-dev.com/v4",
    V3: "https://api.topcoder-dev.com/v3",
    V2: "https://api.topcoder-dev.com/v2",
  },

  MOCK_TERMS_SERVICE: false,
  AV_SCAN_SCORER_REVIEW_TYPE_ID: "55bbb17d-aac2-45a6-89c3-a8d102863d05",
  PROVISIONAL_SCORING_COMPLETED_REVIEW_TYPE_ID: "df51ca7d-fb0a-4147-9569-992fcf5aae48",
  PAGE_SIZE: 50,
  REVIEW_OPPORTUNITY_PAGE_SIZE: 1000,
  CONTENTFUL: {
    LOCAL_MODE: false,
    DEFAULT_SPACE_NAME: "default",
    DEFAULT_ENVIRONMENT: "master",
  },
  FILESTACK: {
    API_KEY: process.env.FILESTACK_API_KEY,
    REGION: "us-east-1",
    SUBMISSION_CONTAINER: process.env.FILESTACK_SUBMISSION_CONTAINER
  },
  /* Time in MS to wait before refreshing challenge details after register
   * and unregister.  Used to allow API sufficent time to update.
   */
  CHALLENGE_DETAILS_REFRESH_DELAY: 3000,
};
