export interface PortfolioUrlEntry {
    value?: string
}

export interface ApplicationFormData {
    name?: string
    email?: string
    address?: string
    coverLetter: string
    resumeUrl?: string
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
