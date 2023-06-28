/* eslint-disable sort-keys */
export default interface MemberAddress {
    streetAddr1: string
    streetAddr2: string
    city: string
    stateCode: string
    zip: string
}

export const emptyMemberAddress: () => MemberAddress = () => ({
    streetAddr1: '',
    streetAddr2: '',
    city: '',
    stateCode: '',
    zip: '',
})
