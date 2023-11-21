/* eslint-disable complexity */
import _ from 'lodash'

import { notifyUniNavi } from '~/apps/profiles/src/lib'

import { ACTIONS } from '../../config'
import ConnectInfo from '../../models/ConnectInfo'
import EducationInfo from '../../models/EducationInfo'
import MemberAddress from '../../models/MemberAddress'
import MemberInfo from '../../models/MemberInfo'
import PersonalizationInfo from '../../models/PersonalizationInfo'
import WorkInfo from '../../models/WorkInfo'

const initialState: {
    memberInfo?: MemberInfo
    works?: WorkInfo[]
    educations?: EducationInfo[]
    personalizations?: PersonalizationInfo[]
    address?: MemberAddress
    connectInfo?: ConnectInfo
    loadingMemberTraits?: boolean
    loadingMemberInfo?: boolean
    availableForGigs?: boolean
} = {
}

const memberReducer: any = (
    state = initialState,
    action: { type: any; payload: any; } = {
        payload: undefined,
        type: '',
    },
) => {
    switch (action.type) {
        case ACTIONS.MEMBER.GET_MEMBER:
            return {
                ...state,
                memberInfo: action.payload,
            }
        case ACTIONS.MEMBER.SET_OPEN_FOR_WORK:
            return {
                ...state,
                availableForGigs: action.payload,
            }
        case ACTIONS.MEMBER.SET_WORKS:
            return {
                ...state,
                works: action.payload,
            }
        case ACTIONS.MEMBER.SET_PERSONALIZATIONS:
            return {
                ...state,
                personalizations: action.payload,
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
        case ACTIONS.MEMBER.SET_DESCRIPTION: {
            if (!state.memberInfo) {
                return state
            }

            const newMemberInfo = _.cloneDeep(state.memberInfo)
            newMemberInfo.description = action.payload

            return {
                ...state,
                memberInfo: newMemberInfo,
            }
        }

        case ACTIONS.MEMBER.UPDATE_MEMBER_PHOTO_URL: {
            if (!state.memberInfo) {
                return state
            }

            const newMemberInfo = _.cloneDeep(state.memberInfo)
            newMemberInfo.photoURL = action.payload
            if (newMemberInfo) {
                notifyUniNavi(newMemberInfo as any)
            }

            return {
                ...state,
                memberInfo: newMemberInfo,
            }
        }

        default:
            return state
    }
}

export default memberReducer
