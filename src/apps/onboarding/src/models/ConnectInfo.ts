export default interface ConnectInfo {
    country: string
    phoneNumber: string
}

export const emptyConnectInfo: () => ConnectInfo = () => ({
    country: '',
    phoneNumber: '',
})
