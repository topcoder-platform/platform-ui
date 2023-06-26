/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable default-param-last */
import { Member } from '~/apps/talent-search/src/lib/models'
import { ACTIONS } from '../../config'
import WorkInfo from '../../models/WorkInfo'
import EducationInfo from '../../models/EducationInfo'

const initialState: {
  memberInfo?: Member
  works?: WorkInfo[]
  educations?: EducationInfo[]
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
        case ACTIONS.MEMBER.SET_LOADING_MEMBER_TRAITS:
            return {
                ...state,
                loadingMemberTraits: action.payload,
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

        default:
            return state
    }
}

export default memberReducer
