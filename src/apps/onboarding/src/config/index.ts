/* eslint-disable sort-keys */
export const ACTIONS: {
    MEMBER: {
        GET_MEMBER: string;
        UPDATE_MEMBER_SKILLS: string;
        SET_WORKS: string;
        SET_EDUCATIONS: string;
        SET_LOADING_MEMBER_TRAITS: string;
    };
} = {
    MEMBER: {
        GET_MEMBER: 'GET_MEMBER',
        UPDATE_MEMBER_SKILLS: 'UPDATE_MEMBER_SKILLS',
        SET_WORKS: 'SET_WORKS',
        SET_EDUCATIONS: 'SET_EDUCATIONS',
        SET_LOADING_MEMBER_TRAITS: 'SET_LOADING_MEMBER_TRAITS',
    },
}

export const INDUSTRIES_OPTIONS: string[] = [
    'Banking',
    'Consumer goods',
    'Energy',
    'Entertainment',
    'Healthcare',
    'Pharma',
    'Tech & technology services',
    'Telecoms',
    'Public sector',
    'Travel & hospitality',
]
