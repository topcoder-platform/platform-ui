import { BackendSkillCategory } from './BackendSkillCategory.model'

export interface BackendSkill {
    id: string
    name: string
    category: BackendSkillCategory
}
