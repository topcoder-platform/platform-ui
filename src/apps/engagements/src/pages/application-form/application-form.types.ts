export interface PortfolioUrlEntry {
    value?: string
}

export interface ApplicationFormData {
    name?: string
    email?: string
    address?: string
    coverLetter: string
    /** URL of the CV file uploaded to S3 through Filestack. */
    cvFileUrl?: string
    portfolioUrls: PortfolioUrlEntry[]
    /** Pay rate the applicant expects, as free text (e.g. "$50/hour"). */
    expectedPayRate: string
    /** How the applicant came to know of the opportunity. */
    referralSource?: string
    availability?: string
    mobileNumber?: string
}

export interface PrePopulatedUserData {
    name: string
    email: string
    address?: string
    mobileNumber?: string
}
