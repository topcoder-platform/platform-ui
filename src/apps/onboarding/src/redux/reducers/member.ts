/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable default-param-last */
import { Member } from '~/apps/talent-search/src/lib/models'
import { ACTIONS } from '../../config'
import WorkInfo from '../../models/WorkInfo'
import EducationInfo from '../../models/EducationInfo'
import PersonalizationInfo from '../../models/PersonalizationInfo'
import MemberAddress from '../../models/MemberAddress'
import ConnectInfo from '../../models/ConnectInfo'

const initialState: {
    memberInfo?: Member
    works?: WorkInfo[]
    educations?: EducationInfo[]
    personalization?: PersonalizationInfo
    address?: MemberAddress
    connectInfo?: ConnectInfo
    loadingMemberTraits?: boolean
    loadingMemberInfo?: boolean
} = {
}

const memberReducer: any = (state = initialState, action: { type: any; payload: any; }) => {
    switch (action.type) {
        case ACTIONS.MEMBER.GET_MEMBER:
            return {
                ...state,
                memberInfo: action.payload,
            }
        case ACTIONS.MEMBER.SET_WORKS:
            return {
                ...state,
                works: action.payload,
            }
        case ACTIONS.MEMBER.SET_PERSONALIZATION:
            return {
                ...state,
                personalization: action.payload,
            }
        case ACTIONS.MEMBER.SET_ADDRESS:
            return {
                ...state,
                address: action.payload,
            }
        case ACTIONS.MEMBER.SET_CONNECT_INFO:
            return {
                ...state,
                connectInfo: action.payload,
            }
        case ACTIONS.MEMBER.SET_LOADING_MEMBER_TRAITS:
            return {
                ...state,
                loadingMemberTraits: action.payload,
            }
        case ACTIONS.MEMBER.SET_LOADING_MEMBER_INFO:
            return {
                ...state,
                loadingMemberInfo: action.payload,
            }
        case ACTIONS.MEMBER.SET_EDUCATIONS:
            return {
                ...state,
                educations: action.payload,
            }
        case ACTIONS.MEMBER.UPDATE_MEMBER_SKILLS: {
            if (!state.memberInfo) {
                return state
            }

            return {
                ...state,
                memberInfo: {
                    ...state.memberInfo,
                    emsiSkills: action.payload,
                },
            }
        }

        case ACTIONS.MEMBER.UPDATE_MEMBER_PHOTO_URL: {
            if (!state.memberInfo) {
                return state
            }

            return {
                ...state,
                memberInfo: {
                    ...state.memberInfo,
                    photoURL: action.payload,
                },
            }
        }

        default:
            return state
    }
}

export default memberReducer
