export interface PortfolioUrlEntry {
    value?: string
}

export interface ApplicationFormData {
    name?: string
    email?: string
    address?: string
    coverLetter: string
    /** Link to a resume or professional profile (LinkedIn, Google Drive CV, personal website). */
    resumeUrl?: string
    /** URL of the CV file uploaded to S3 through Filestack. */
    cvFileUrl?: string
    portfolioUrls: PortfolioUrlEntry[]
    yearsOfExperience?: number
    availability?: string
    mobileNumber?: string
}

export interface PrePopulatedUserData {
    name: string
    email: string
    address?: string
    mobileNumber?: string
}
