export interface TaasJobSelectOption {
    label: string
    value: string
}

export interface TaasJobValueOption {
    title: string
    value: string
}

export interface TaasSkill {
    name: string
    skillId: string
}

export interface TaasJob {
    jobId?: string | number
    title: string
    role: TaasJobValueOption
    workLoad: TaasJobValueOption
    skills: TaasSkill[]
    description: string
    people: string
    duration: string
}

export interface TaasJobFormData {
    jobId?: string | number
    title: string
    role: TaasJobSelectOption
    workLoad: TaasJobSelectOption
    skills: TaasSkill[]
    description: string
    people: string
    duration: string
}
