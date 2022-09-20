import { flatten, map } from 'lodash'
// tslint:disable-next-line: no-submodule-imports
import useSWRInfinite, { SWRInfiniteResponse } from 'swr/infinite'

import { InfinitePageDao } from './infinite-page-dao.model'
import { InfinitePageHandler } from './infinite-page-handler.model'

export function useGetInfinitePage<T>(getKey: (index: number, previousPageData: InfinitePageDao<T>) => string | undefined):
    InfinitePageHandler<T> {

    const { data, setSize, size }: SWRInfiniteResponse<InfinitePageDao<T>> = useSWRInfinite(getKey, { revalidateFirstPage: false })

    // flatten version of badges paginated data
    const outputData: ReadonlyArray<T> = flatten(map(data, dao => dao.rows))

    function getAndSetNext(): void {
        setSize(size + 1)
    }

    return {
        data: outputData,
        getAndSetNext,
        hasMore: outputData.length < (data?.[0]?.count || 0),
    }
}
