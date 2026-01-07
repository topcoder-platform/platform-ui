export interface ApplicationFormData {
    coverLetter?: string
    resumeUrl?: string
    portfolioUrls?: string[]
    yearsOfExperience?: number
    availability?: string
}

export interface PrePopulatedUserData {
    name: string
    email: string
    address?: string
}
