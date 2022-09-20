export interface InfinitePageHandler<T> {
    data?: ReadonlyArray<T>
    getAndSetNext: () => void
    hasMore: boolean
}
