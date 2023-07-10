export const ACTIONS: {
    MEMBER: {
        GET_MEMBER: string;
        UPDATE_MEMBER_PHOTO_URL: string;
        SET_WORKS: string;
        SET_EDUCATIONS: string;
        SET_PERSONALIZATION: string;
        SET_ADDRESS: string;
        SET_CONNECT_INFO: string;
        SET_LOADING_MEMBER_TRAITS: string;
        SET_LOADING_MEMBER_INFO: string;
    };
} = {
    MEMBER: {
        GET_MEMBER: 'GET_MEMBER',
        SET_ADDRESS: 'SET_ADDRESS',
        SET_CONNECT_INFO: 'SET_CONNECT_INFO',
        SET_EDUCATIONS: 'SET_EDUCATIONS',
        SET_LOADING_MEMBER_INFO: 'SET_LOADING_MEMBER_INFO',
        SET_LOADING_MEMBER_TRAITS: 'SET_LOADING_MEMBER_TRAITS',
        SET_PERSONALIZATION: 'SET_PERSONALIZATION',
        SET_WORKS: 'SET_WORKS',
        UPDATE_MEMBER_PHOTO_URL: 'UPDATE_MEMBER_PHOTO_URL',
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
