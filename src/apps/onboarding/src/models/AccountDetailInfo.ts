/* eslint-disable sort-keys */
export default interface AccountDetailInfo {
    streetAddr1: string
    streetAddr2: string
    city: string
    stateCode: string
    zip: string
    country: string
    phoneNumber: string
}

export const emptyAccountDetailInfo: () => AccountDetailInfo = () => ({
    streetAddr1: '',
    streetAddr2: '',
    city: '',
    stateCode: '',
    zip: '',
    country: '',
    phoneNumber: '',
})
