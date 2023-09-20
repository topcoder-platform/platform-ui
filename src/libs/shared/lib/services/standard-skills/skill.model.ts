export enum SkillSources {
    selfPicked = 'SelfPicked',
    challengeWin = 'ChallengeWin',
    tcaCertified = 'TCACertified',
}

export interface Skill {
    id: string;
    name: string;
    skillSources?: SkillSources[];
}
