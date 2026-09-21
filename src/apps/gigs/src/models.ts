/** Recruit CRM's public job and candidate contracts, served by community-app. */
export interface RecruitField {
    field_id: number
    field_name?: string
    value: string | number | boolean | null
}

export interface Gig {
    slug?: string
    name?: string
    country?: string | null
    custom_fields?: RecruitField[]
    created_on?: string
    updated_on?: string
    min_annual_salary?: number | null
    max_annual_salary?: number | null
    salary_type?: { id: number } | string | null
    job_description_text?: string
    job_status?: { id: number; label?: string }
    enable_job_application_form?: number
}

export interface Candidate {
    slug?: string
    contact_number?: string
    locality?: string
    city?: string
    salary_expectation?: string | number
    skill?: string
    resume?: { file_link: string; filename: string }
    custom_fields?: RecruitField[]
}

export interface ApplicationValues {
    firstName: string
    lastName: string
    email: string
    phone: string
    city: string
    country: string
    pay: string
    skills: string[]
    referral: string
    timezone: string
    duration: string
    terms: boolean
    resume?: File
}

export type ApplicationErrors = Partial<Record<keyof ApplicationValues, string>>
