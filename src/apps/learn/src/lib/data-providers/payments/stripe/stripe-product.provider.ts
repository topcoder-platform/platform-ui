import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet } from '../../../functions'
import { useSwrCache } from '../../../learn-swr'

import { StripeProduct, StripeProductData } from './stripe-product.model'

export function useGetStripeProduct(productId: string): StripeProductData {

    const url: string = learnUrlGet(
        'payments',
        'stripe',
        'products',
        productId,
    )
    const swrCacheConfig: SWRConfiguration = useSwrCache(url)

    const { data: product, error }: SWRResponse<StripeProduct> = useSWR(productId ? url : undefined, swrCacheConfig)

    return {
        loading: !product && !error,
        product,
        ready: !!product || !!error,
    }
}
