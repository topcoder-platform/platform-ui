import MemberEmsiSkill from './MemberEmsiSkill';
import MemberMaxRating from './MemberMaxRating';
import MemberStats from './MemberStats';

export default interface Member {
    userId: number;
    handle: string;
    status: string;
    firstName: string;
    lastName: string;
    competitionCountryCode: string;
    email: string;
    accountAge: number;
    maxRating: MemberMaxRating;
    emsiSkills: Array<MemberEmsiSkill>;
    stats:Array<MemberStats>;
    country:string;
    photoURL:string;   
    createdAt:number;
}

  