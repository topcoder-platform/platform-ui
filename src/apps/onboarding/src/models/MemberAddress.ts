export default interface MemberAddress {
    streetAddr1: string
    streetAddr2: string
    city: string
    stateCode: string
    zip: string
}

export const emptyMemberAddress: () => MemberAddress = () => ({
    city: '',
    stateCode: '',
    streetAddr1: '',
    streetAddr2: '',
    zip: '',
})
