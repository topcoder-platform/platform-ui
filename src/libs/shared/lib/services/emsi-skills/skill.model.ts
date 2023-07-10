export enum EmsiSkillSources {
    selfPicked = 'SelfPicked',
    challengeWin = 'ChallengeWin',
}

export interface Skill {
    name: string;
    emsiId: string;
    sources?: EmsiSkillSources[];
}

export interface EmsiSkill {
    name: string;
    skillId: string;
    skillSources: EmsiSkillSources[]
}
