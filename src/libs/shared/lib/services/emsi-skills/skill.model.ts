export enum EmsiSkillSources {
    selfPicked = 'SelfPicked',
    challengeWin = 'ChallengeWin',
}

export interface Skill {
    name: string;
    emsiId: string;
    skillSources?: EmsiSkillSources[];
}

export interface EmsiSkill {
    name: string;
    skillId: string;
    skillSources: EmsiSkillSources[]
}
