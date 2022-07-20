import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { ResourceProviderData } from './resource-provider-data.model'
import { getResourceProvidersAsync } from './resource-provider-functions/resource-provider.store'

export function useResourceProvider(providerName?: string): ResourceProviderData {
    const [state, setState]: [ResourceProviderData, Dispatch<SetStateAction<ResourceProviderData>>] = useState<ResourceProviderData>({
        loading: false,
        ready: false,
    })
    
    useEffect(() => {
        if (!providerName) {
            setState((prevState) => ({
                ...prevState,
                provider: undefined,
                loading: false,
                ready: false,
            }))
            return
        }

        setState((prevState) => ({
            ...prevState,
            loading: true,
        }))

        getResourceProvidersAsync().then((providers) => {
            setState((prevState) => ({
                ...prevState,
                provider: providers?.find(p => p.name === providerName),
                loading: false,
                ready: true,
            }))
        })
    }, [providerName])

    return state
}