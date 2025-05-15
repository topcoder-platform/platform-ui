import useSWR, { KeyedMutator, SWRResponse } from 'swr'

import { WalletDetails } from '../models/WalletDetails'
import { getWalletDetails } from '../services/wallet'

export interface Response<T> {
    data?: Readonly<T>
    error?: Readonly<string>
    mutate: KeyedMutator<any>
    isLoading?: Readonly<boolean>
}

export type WalletDetailsResponse = Response<WalletDetails>

export function useWalletDetails(): WalletDetailsResponse {
    const { data, error, mutate, isValidating }: SWRResponse = useSWR('wallet-details', getWalletDetails)

    return {
        data,
        error,
        isLoading: isValidating && !data && !error,
        mutate,
    }
}
