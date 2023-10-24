import { MemberDisplayName } from './MemberDisplayName'
import MemberAddress from './MemberAddress'
import MemberEmsiSkill from './MemberEmsiSkill'
import MemberMaxRating from './MemberMaxRating'
import MemberStats from './MemberStats'

export default interface Member {
    addresses: MemberAddress[];
    accountAge: number;
    competitionCountryCode: string;
    country: string;
    createdAt: number;
    description: string;
    email: string;
    emsiSkills: Array <MemberEmsiSkill>;
    firstName: string;
    handle: string;
    homeCountryCode: string;
    lastName: string;
    namesAndHandleAppearance: MemberDisplayName
    maxRating: MemberMaxRating;
    numberOfChallengesPlaced: number;
    numberOfChallengesWon: number;
    photoURL: string;
    skillScore: number;
    stats: Array <MemberStats>;
    status: string;
    userId: number;
    verified: string;
}
