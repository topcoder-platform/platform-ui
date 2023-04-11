
import config from "../config";
import { SORT_ORDER } from "./challenges";

export const GIGS_SUBSCRIPTION_API_URL = `${config.URL.BASE}/api/mailchimp`;

// Unknown magic values from community app used for gigs' email subscriptions.
export const GIGS_SUBSCRIPTION_GROUPS = { d0c48e9da3: true };
export const GIGS_SUBSCRIPTION_LIST_ID = "28bfd3c062";

export const GIGS_FILTER_STATUSES = {
    ACTIVE_JOBS: "Active Gigs",
    OPEN_JOBS: "Open Applications",
    COMPLETED_JOBS: "Completed Gigs",
    ARCHIVED_JOBS: "Archived Applications",
};

export const GIGS_FILTER_STATUSES_PARAM = {
    [GIGS_FILTER_STATUSES.ACTIVE_JOBS]: "active_jobs",
    [GIGS_FILTER_STATUSES.OPEN_JOBS]: "open_jobs",
    [GIGS_FILTER_STATUSES.COMPLETED_JOBS]: "completed_jobs",
    [GIGS_FILTER_STATUSES.ARCHIVED_JOBS]: "archived_jobs",
};

export const MY_GIG_PHASE = {
    APPLIED: "Applied",
    SKILLS_TEST: "Skills Test",
    PHONE_SCREEN: "Phone Screen",
    SCREEN_PASS: "Screen Pass",
    INTERVIEW_PROCESS: "Interview Process",
    SELECTED: "Selected",
    OFFERED: "Offered",
    PLACED: "Placed",
    NOT_SELECTED: "Not Selected",
    JOB_CLOSED: "Job Closed",
    WITHDRAWN: "Withdrawn",
    COMPLETED: "Completed",
};

export const MY_GIG_PHASE_LABEL = {
    APPLIED: "APPLIED",
    SKILLS_TEST: "SKILLS TEST",
    PHONE_SCREEN: "PHONE SCREEN",
    SCREEN_PASS: "SCREEN PASS",
    INTERVIEW_PROCESS: "INTERVIEW PROCESS",
    SELECTED: "SELECTED",
    OFFERED: "OFFERED",
    PLACED: "PLACED",
    NOT_SELECTED: "NOT SELECTED",
    JOB_CLOSED: "JOB CLOSED",
    WITHDRAWN: "WITHDRAWN",
    COMPLETED: "COMPLETED",
};

export const MY_GIG_PHASE_STATUS = {
    PASSED: "Passed",
    ACTIVE: "Active",
};

export const MY_GIG_PHASE_ACTION = {
    CHECK_EMAIL: "check email",
    STAND_BY: "stand by",
};

export const MY_GIGS_JOB_STATUS = {
    APPLIED: "applied",
    SKILLS_TEST: "skills-test",
    PHONE_SCREEN: "phone-screen",
    SCREEN_PASS: "open",
    INTERVIEW: "interview",
    SELECTED: "selected",
    OFFERED: "offered",
    PLACED: "placed",
    REJECTED_OTHER: "rejected - other",
    REJECTED_PRE_SCREEN: "rejected-pre-screen",
    CLIENT_REJECTED_INTERVIEW: "client rejected - interview",
    CLIENT_REJECTED_SCREENING: "client rejected - screening",
    JOB_CLOSED: "job-closed",
    WITHDRAWN: "withdrawn",
    WITHDRAWN_PRESCREEN: "withdrawn-prescreen",
    COMPLETED: "completed",
};
/**
* Maps the status from API to gig status
*/
export const JOB_STATUS_MAPPER = {
    [MY_GIGS_JOB_STATUS.APPLIED]: MY_GIG_PHASE.APPLIED,
    [MY_GIGS_JOB_STATUS.SKILLS_TEST]: MY_GIG_PHASE.SKILLS_TEST,
    [MY_GIGS_JOB_STATUS.PHONE_SCREEN]: MY_GIG_PHASE.PHONE_SCREEN,
    [MY_GIGS_JOB_STATUS.SCREEN_PASS]: MY_GIG_PHASE.SCREEN_PASS,
    [MY_GIGS_JOB_STATUS.INTERVIEW]: MY_GIG_PHASE.INTERVIEW_PROCESS,
    [MY_GIGS_JOB_STATUS.SELECTED]: MY_GIG_PHASE.SELECTED,
    [MY_GIGS_JOB_STATUS.OFFERED]: MY_GIG_PHASE.OFFERED,
    [MY_GIGS_JOB_STATUS.PLACED]: MY_GIG_PHASE.PLACED,
    [MY_GIGS_JOB_STATUS.REJECTED_OTHER]: MY_GIG_PHASE.NOT_SELECTED,
    [MY_GIGS_JOB_STATUS.REJECTED_PRE_SCREEN]: MY_GIG_PHASE.NOT_SELECTED,
    [MY_GIGS_JOB_STATUS.CLIENT_REJECTED_INTERVIEW]: MY_GIG_PHASE.NOT_SELECTED,
    [MY_GIGS_JOB_STATUS.CLIENT_REJECTED_SCREENING]: MY_GIG_PHASE.NOT_SELECTED,
    [MY_GIGS_JOB_STATUS.JOB_CLOSED]: MY_GIG_PHASE.JOB_CLOSED,
    [MY_GIGS_JOB_STATUS.WITHDRAWN]: MY_GIG_PHASE.WITHDRAWN,
    [MY_GIGS_JOB_STATUS.WITHDRAWN_PRESCREEN]: MY_GIG_PHASE.WITHDRAWN,
    [MY_GIGS_JOB_STATUS.COMPLETED]: MY_GIG_PHASE.COMPLETED,
};

/**
* messages to be shown in each phase/status
*/
export const JOB_STATUS_MESSAGE_MAPPER = {
    [MY_GIG_PHASE.APPLIED]:
    "Thank you for Applying. We will be reviewing your profile shortly.",
    [MY_GIG_PHASE.SKILLS_TEST]: "You are requested to complete a skills test",
    [MY_GIG_PHASE.PHONE_SCREEN]:
    "You need to schedule a phone screen or a phone screen has already been scheduled",
    [MY_GIG_PHASE.SCREEN_PASS]:
    "You have passed our initial crtieria and we are pushing your profile to our client",
    [MY_GIG_PHASE.INTERVIEW_PROCESS]:
    "You are currently in the interview process.  Please check your email for updates.",
    [MY_GIG_PHASE.SELECTED]:
    "The client has selected you for this position!  Please stand by for an offer Letter.",
    [MY_GIG_PHASE.OFFERED]:
    "An offer letter was sent to your email!  Please review and Accept",
    [MY_GIG_PHASE.PLACED]:
    "Congrats on the placement!  Please follow onboarding instructions from the Client and Topcoder Teams.",
    [MY_GIG_PHASE.NOT_SELECTED]: "You were not selected for this position.",
    [MY_GIG_PHASE.JOB_CLOSED]:
    "This position is no longer active.  Please apply to other open gigs.",
    [MY_GIG_PHASE.WITHDRAWN]:
    "You withdrew your application for this gig or you have been placed in another gig.",
    [MY_GIG_PHASE.COMPLETED]: "Congrats on completing the gig!",
};

export const ACTIONS_AVAILABLE_FOR_MY_GIG_PHASE = {
    [MY_GIG_PHASE_ACTION.CHECK_EMAIL]: [
        MY_GIG_PHASE.SKILLS_TEST,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.INTERVIEW_PROCESS,
        MY_GIG_PHASE.OFFERED,
    ],
    [MY_GIG_PHASE_ACTION.STAND_BY]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.SCREEN_PASS,
        MY_GIG_PHASE.SELECTED,
    ],
};
/**
* jobs can have different flows (progress bar) dependending on the status.
* here it's where it's defined the flow
*/
export const PHASES_FOR_JOB_STATUS = {
    [MY_GIGS_JOB_STATUS.APPLIED]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.SCREEN_PASS,
        MY_GIG_PHASE.INTERVIEW_PROCESS,
        MY_GIG_PHASE.SELECTED,
        MY_GIG_PHASE.OFFERED,
        MY_GIG_PHASE.PLACED,
    ],
    [MY_GIGS_JOB_STATUS.SKILLS_TEST]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.SKILLS_TEST,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.SCREEN_PASS,
        MY_GIG_PHASE.INTERVIEW_PROCESS,
        MY_GIG_PHASE.SELECTED,
        MY_GIG_PHASE.OFFERED,
        MY_GIG_PHASE.PLACED,
    ],
    [MY_GIGS_JOB_STATUS.PHONE_SCREEN]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.SCREEN_PASS,
        MY_GIG_PHASE.INTERVIEW_PROCESS,
        MY_GIG_PHASE.SELECTED,
        MY_GIG_PHASE.OFFERED,
        MY_GIG_PHASE.PLACED,
    ],
    [MY_GIGS_JOB_STATUS.SCREEN_PASS]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.SCREEN_PASS,
        MY_GIG_PHASE.INTERVIEW_PROCESS,
        MY_GIG_PHASE.SELECTED,
        MY_GIG_PHASE.OFFERED,
        MY_GIG_PHASE.PLACED,
    ],
    [MY_GIGS_JOB_STATUS.INTERVIEW]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.SCREEN_PASS,
        MY_GIG_PHASE.INTERVIEW_PROCESS,
        MY_GIG_PHASE.SELECTED,
        MY_GIG_PHASE.OFFERED,
        MY_GIG_PHASE.PLACED,
    ],
    [MY_GIGS_JOB_STATUS.SELECTED]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.SCREEN_PASS,
        MY_GIG_PHASE.INTERVIEW_PROCESS,
        MY_GIG_PHASE.SELECTED,
        MY_GIG_PHASE.OFFERED,
        MY_GIG_PHASE.PLACED,
    ],
    [MY_GIGS_JOB_STATUS.OFFERED]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.SCREEN_PASS,
        MY_GIG_PHASE.INTERVIEW_PROCESS,
        MY_GIG_PHASE.SELECTED,
        MY_GIG_PHASE.OFFERED,
        MY_GIG_PHASE.PLACED,
    ],
    [MY_GIGS_JOB_STATUS.PLACED]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.SCREEN_PASS,
        MY_GIG_PHASE.INTERVIEW_PROCESS,
        MY_GIG_PHASE.SELECTED,
        MY_GIG_PHASE.OFFERED,
        MY_GIG_PHASE.PLACED,
    ],
    [MY_GIGS_JOB_STATUS.REJECTED_OTHER]: [MY_GIG_PHASE.NOT_SELECTED],
    [MY_GIGS_JOB_STATUS.REJECTED_PRE_SCREEN]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.NOT_SELECTED,
    ],
    [MY_GIGS_JOB_STATUS.CLIENT_REJECTED_INTERVIEW]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.SCREEN_PASS,
        MY_GIG_PHASE.INTERVIEW_PROCESS,
        MY_GIG_PHASE.NOT_SELECTED,
    ],
    [MY_GIGS_JOB_STATUS.CLIENT_REJECTED_SCREENING]: [
        MY_GIG_PHASE.APPLIED,
        MY_GIG_PHASE.PHONE_SCREEN,
        MY_GIG_PHASE.SCREEN_PASS,
        MY_GIG_PHASE.NOT_SELECTED,
    ],
    [MY_GIGS_JOB_STATUS.JOB_CLOSED]: [MY_GIG_PHASE.JOB_CLOSED],
    [MY_GIGS_JOB_STATUS.WITHDRAWN]: [MY_GIG_PHASE.WITHDRAWN],
    [MY_GIGS_JOB_STATUS.WITHDRAWN_PRESCREEN]: [MY_GIG_PHASE.WITHDRAWN],
    [MY_GIGS_JOB_STATUS.COMPLETED]: [MY_GIG_PHASE.COMPLETED],
};

/**
* definition of how the sort is made on status. the order in the array defined the
* priority.
*/
export const SORT_STATUS_ORDER = [
    MY_GIG_PHASE.PLACED,
    MY_GIG_PHASE.OFFERED,
    MY_GIG_PHASE.SELECTED,
    MY_GIG_PHASE.INTERVIEW_PROCESS,
    MY_GIG_PHASE.SCREEN_PASS,
    MY_GIG_PHASE.PHONE_SCREEN,
    MY_GIG_PHASE.SKILLS_TEST,
    MY_GIG_PHASE.APPLIED,
    MY_GIG_PHASE.WITHDRAWN,
    MY_GIG_PHASE.JOB_CLOSED,
    MY_GIG_PHASE.NOT_SELECTED,
    MY_GIG_PHASE.COMPLETED,
];

export const PER_PAGE = 10;

/**
* defines which status can show remarks
*/
export const AVAILABLE_REMARK_BY_JOB_STATUS = [
    MY_GIGS_JOB_STATUS.SKILLS_TEST,
    MY_GIGS_JOB_STATUS.PHONE_SCREEN,
    MY_GIGS_JOB_STATUS.SCREEN_PASS,
    MY_GIGS_JOB_STATUS.OFFERED,
    MY_GIGS_JOB_STATUS.PLACED,
    MY_GIGS_JOB_STATUS.REJECTED_OTHER,
    MY_GIGS_JOB_STATUS.REJECTED_PRE_SCREEN,
    MY_GIGS_JOB_STATUS.JOB_CLOSED,
    MY_GIGS_JOB_STATUS.WITHDRAWN,
    MY_GIGS_JOB_STATUS.WITHDRAWN_PRESCREEN,
];
export const MY_GIG_STATUS_PLACED = "PLACED";

export const GIG_STATUS = {
    AVAILABLE: "Available",
    UNAVAILABLE: "Unavailable",
};

export const GIG_STATUS_TOOLTIP = {
    AVAILABLE: "You’re open to take on new jobs.",
    UNAVAILABLE: "You’re not open to take on new jobs.",
};

export const MY_GIGS_STATUS_EMPTY_TEXT = {
    [GIGS_FILTER_STATUSES.ACTIVE_JOBS]:
    "YOU ARE NOT ENGAGED IN ANY GIGS AT THE MOMENT.",
    [GIGS_FILTER_STATUSES.OPEN_JOBS]:
    "LOOKS LIKE YOU HAVEN'T APPLIED TO ANY GIG OPPORTUNITIES YET.",
    [GIGS_FILTER_STATUSES.COMPLETED_JOBS]:
    "YOU DON'T HAVE ANY COMPLETED GIGS YET.",
    [GIGS_FILTER_STATUSES.ARCHIVED_JOBS]: "YOU DON'T HAVE ANY ARCHIVED GIGS YET.",
};

export const MY_GIGS_STATUS_REMARK_TEXT = {
    [MY_GIGS_JOB_STATUS.WITHDRAWN]:
    "You withdrew your application for this gig or you have been placed in another gig.",
    [MY_GIGS_JOB_STATUS.WITHDRAWN_PRESCREEN]:
    "You withdrew your application for this gig or you have been placed in another gig.",
    [MY_GIGS_JOB_STATUS.COMPLETED]: "Congrats on completing the gig!",
};

export const CHECKING_GIG_TIMES = 3;

export const DELAY_CHECK_GIG_TIME = 2000;

export const DEBOUNCE_ON_CHANGE_TIME = 300;

export const MAX_RESUME_FILE_SIZE_MB = 8;

export const LOCATION = {
    ALL: "All",
    ANY: "Any",
    ANYWHERE: "Anywhere",
    ANY_LOCATION: "Any Location",
};

export const API_SORT_BY = {
    API_DATE_ADDED: "createdAt",
    API_DATE_UPDATED: "updatedAt",
};

export const SORT_BY = {
    DATE_ADDED: "DATE_ADDED",
    DATE_UPDATED: "DATE_UPDATED",
};

export const GIGS_API_URL = `${config.URL.PLATFORM_WEBSITE}${config.GIGS_API_BASE_PATH}/jobs`;

export const GIGS_HOT_COUNT = 3;
export const GIGS_HOT_INDEX = 1; // gigs' hotlist is displayed after this index

export const PAGE_SIZES = [10, 20, 50, 100];

export const PAYMENT_MAX_VALUE = 1e15;

export const SORT_BY_DEFAULT = SORT_BY.DATE_ADDED;
export const SORT_ORDER_DEFAULT = SORT_ORDER.DESC;

export const SORT_BY_TO_API = {
  [SORT_BY.DATE_ADDED]: API_SORT_BY.DATE_ADDED,
  [SORT_BY.DATE_UPDATED]: API_SORT_BY.DATE_UPDATED,
};

// maps state keys to URL parameter names in search query
export const URL_QUERY_PARAMS_MAP = new Map([
  ["title", "title"],
  ["location", "location"],
  ["paymentMin", "pay_min"],
  ["paymentMax", "pay_max"],
  ["sortBy", "by"],
  ["sortOrder", "order"],
  ["pageSize", "perpage"],
  ["pageNumber", "page"],
]);

export const FREQUENCY_TO_PERIOD = {
    daily: "day",
    hourly: "hour",
    weekly: "week",
};