import { KeyedMutator } from 'swr'

import { InfinitePageDao } from './infinite-page-dao.model'

export interface InfinitePageHandler<T> {
    data?: ReadonlyArray<T>
    getAndSetNext: () => void
    hasMore: boolean
    mutate: KeyedMutator<Array<InfinitePageDao<T>>>
}
