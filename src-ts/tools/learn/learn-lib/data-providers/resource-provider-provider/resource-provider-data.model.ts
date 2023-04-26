import { ResourceProvider } from './resource-provider.model'

export interface ResourceProviderData {
    loading: boolean
    provider?: ResourceProvider
    ready: boolean
}
