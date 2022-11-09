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
            setState(prevState => ({
                ...prevState,
                loading: false,
                provider: undefined,
                ready: false,
            }))
            return
        }

        setState(prevState => ({
            ...prevState,
            loading: true,
        }))

        getResourceProvidersAsync().then(providers => {
            setState(prevState => ({
                ...prevState,
                loading: false,
                provider: providers?.find(p => p.name === providerName),
                ready: true,
            }))
        })
    }, [providerName])

    return state
}
