import { NamesAndHandleAppearance, UserSkill } from '~/libs/core'

import MemberAddress from './MemberAddress'
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
    skills: Array<UserSkill>;
    firstName: string;
    handle: string;
    homeCountryCode: string;
    lastName: string;
    namesAndHandleAppearance: NamesAndHandleAppearance
    maxRating: MemberMaxRating;
    numberOfChallengesPlaced: number;
    numberOfChallengesWon: number;
    photoURL: string;
    skillScore: number;
    stats: Array<MemberStats>;
    status: string;
    userId: number;
    verified: string;
}
