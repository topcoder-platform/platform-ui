export const ENGAGEMENTS_PER_PAGE = 20
export const APPLICATIONS_PER_PAGE = 10
export const APPLICATION_COVER_LETTER_MAX_LENGTH = 5000
export const APPLICATION_PORTFOLIO_LINKS_MAX = 5
export const APPLICATION_CARD_DESCRIPTION_MAX_LENGTH = 150

/** A timesheet date range may not span more than 31 days - the API enforces the same cap. */
export const TIMESHEET_MAX_RANGE_DAYS = 31

/** Hard ceiling on hours for one day. Above the assignment's standard hours is only a warning. */
export const TIMESHEET_MAX_HOURS_PER_DAY = 24
