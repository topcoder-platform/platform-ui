import SkillScore from './SkillScore'

export default interface Member {
    userId: number;
    handle: string;
    firstName: string;
    lastName: string;
    country: string;
    accountAge: number;
    numberOfChallengesWon: number;
    numberOfChallengesPlaced: number;
    skills: Array<SkillScore>;
    searchedSkills: Array<SkillScore>;
    roles: Array<string>;
    domains: Array<string>;
    totalSkillScore: number;
    searchedSkillScore: number;
}

  