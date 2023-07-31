import { EmsiSkillSources } from '~/libs/shared'

export default interface MemberEmsiSkill {
    skillSources: EmsiSkillSources[];
    skillSubcategory: EmsiSkillSources;
    skillId: string
    name: string;
    category: string;
}
