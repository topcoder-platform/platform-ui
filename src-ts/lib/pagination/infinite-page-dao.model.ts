export interface InfinitePageDao<T> {
    count: number
    rows: ReadonlyArray<T>
}
