export type YesNoAnswer = 'yes' | 'no'

export interface ApplicationFormData {
    name?: string
    email?: string
    address?: string
    /** URL of the CV file uploaded to S3 through Filestack. */
    cvFileUrl?: string
    /** Pay rate the applicant expects, as free text (e.g. "$50/hour"). */
    expectedPayRate: string
    /** How the applicant came to know of the opportunity; one of `REFERRAL_SOURCE_OPTIONS`. */
    referralSource?: string
    /** Handle of the member who referred the applicant, when `referralSource` is "Referred by". */
    referrerHandle?: string
    /** Whether the applicant can start within a week. */
    availableWithinWeek?: YesNoAnswer
    /** Whether the applicant can work full-time (around 8 hours per day). */
    availableFullTime?: YesNoAnswer
    mobileNumber?: string
}

export interface PrePopulatedUserData {
    name: string
    email: string
    address?: string
    mobileNumber?: string
}
