import { KeyedMutator } from 'swr'

import { InfinitePageDao } from './infinite-page-dao.model'

export interface InfinitePageHandler<T> {
    data?: ReadonlyArray<T>
    getAndSetNext: () => void
    hasMore: boolean
    isValidating: boolean
    mutate: KeyedMutator<Array<InfinitePageDao<T>>>
}
