/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable default-param-last */
import { Member } from '~/apps/talent-search/src/lib/models'
import { ACTIONS } from '../../config'

const initialState: {
  memberInfo?: Member
} = {
}

const memberReducer: any = (state = initialState, action: { type: any; payload: any; }) => {
    switch (action.type) {
        case ACTIONS.MEMBER.GET_MEMBER:
            return {
                ...state,
                memberInfo: action.payload,
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
