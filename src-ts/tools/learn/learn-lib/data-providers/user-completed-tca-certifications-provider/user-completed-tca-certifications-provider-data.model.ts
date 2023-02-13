import { UserCompletedTCACertification } from './user-completed-tca-certification.model'

export interface UserCompletedTCACertificationsProviderData {
    certifications: ReadonlyArray<UserCompletedTCACertification>
    loading: boolean
    ready: boolean
}
