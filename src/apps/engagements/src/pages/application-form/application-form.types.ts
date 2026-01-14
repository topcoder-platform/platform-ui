export interface PortfolioUrlEntry {
    value?: string
}

export interface ApplicationFormData {
    coverLetter?: string
    resumeUrl?: string
    portfolioUrls: PortfolioUrlEntry[]
    yearsOfExperience?: number
    availability?: string
}

export interface PrePopulatedUserData {
    name: string
    email: string
    address?: string
}
