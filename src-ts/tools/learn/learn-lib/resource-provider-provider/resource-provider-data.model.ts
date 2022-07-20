import { ResourceProvider } from './resource-provider-functions'

export interface ResourceProviderData {
    loading: boolean
    provider?: ResourceProvider
    ready: boolean
}
