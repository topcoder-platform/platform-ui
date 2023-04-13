interface GuiKITConfig {
    DEBOUNCE_ON_CHANGE_TIME: 150
}

interface URLSConfig {
    COMMUNITY_APP: string
    PLATFORM_WEBSITE: string
    ARENA: string
    BASE: string
    HOME: string
    BLOG: string
    BLOG_FEED: string
    COMMUNITY: string
    FORUMS: string
    FORUMS_VANILLA: string
    HELP: string
    SUBMISSION_REVIEW: string
    THRIVE: string

    COMMUNITIES: {
        BLOCKCHAIN: string
        COGNITIVE: string
        ZURICH: string
        COMCAST: string
        CS: string
    }

    INFO: {
        DESIGN_CHALLENGES: string
        DESIGN_CHALLENGE_CHECKPOINTS: string
        DESIGN_CHALLENGE_SUBMISSION: string
        DESIGN_CHALLENGE_TYPES: string
        RELIABILITY_RATINGS_AND_BONUSES: string
        STOCK_ART_POLICY: string
        STUDIO_FONTS_POLICY: string
        TOPCODER_TERMS: string
        HOWTOCOMPETEINMARATHON: string
        USABLECODEDEV: string
        EXTENSIONVSCODE: string
        TEMPLATES_REPO: string
    }

    IOS: string
    MEMBER: string
    ONLINE_REVIEW: string
    PAYMENT_TOOL: string
    STUDIO: string
    TCO: string
    TCO17: string
    TCO19: string
    TOPGEAR: string
    USER_SETTINGS: string
    WIPRO: string
    COMMUNITY_API: string
    COMMUNITY_APP_GITHUB_ISSUES: string
    EMAIL_VERIFY_URL: string
    ABANDONMENT_EMBED: string
    SUBDOMAIN_PROFILE_CONFIG: any[]
}

export interface EarnConfig {
  GUIKIT: GuiKITConfig
  CHALLENGE_DETAILS_MAX_NUMBER_RECOMMENDED_CHALLENGES: number
  SERVER_API_KEY: string
  URL: URLSConfig
  TC_EDU_BASE_PATH: string
  TC_EDU_ARTICLES_PATH: string
  ENABLE_RECOMMENDER: boolean

  MOCK_TERMS_SERVICE: boolean
  AV_SCAN_SCORER_REVIEW_TYPE_ID: string
  PROVISIONAL_SCORING_COMPLETED_REVIEW_TYPE_ID: string
  PAGE_SIZE: number
  REVIEW_OPPORTUNITY_PAGE_SIZE: number
  CONTENTFUL: {
    LOCAL_MODE: boolean
    DEFAULT_SPACE_NAME: string
    DEFAULT_ENVIRONMENT: string
  }

  FILESTACK: {
    API_KEY: string | undefined
    REGION: string | undefined
    SUBMISSION_CONTAINER: string | undefined
  }

  CHALLENGE_DETAILS_REFRESH_DELAY: number

  PROXY_API: string
  RECRUIT_API: string
  GIGS_API_BASE_PATH: string
  GROWSURF_COOKIE: string
  GROWSURF_COOKIE_SETTINGS: {
    secure: boolean
    domain: string | undefined
    expires: number | undefined
  }

  APPLIED_GIGS: string
  CDN: { PUBLIC: string }
}
