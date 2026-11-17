export interface Skill {
    id: string
    name: string
    // A skill from a lead intake form with no standardized match yet. It is sent by name and the
    // API creates it as a standardized skill when the engagement is saved.
    isNew?: boolean
}

export interface SkillOption {
    id: string
    label: string
    name: string
    value: string
}
