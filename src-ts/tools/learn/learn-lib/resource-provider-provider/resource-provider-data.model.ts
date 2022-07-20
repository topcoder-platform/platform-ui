import { ResourceProvider } from './resource-provider-functions'

export interface ResourceProviderData {
    provider?: ResourceProvider
    loading: boolean
    ready: boolean
}
