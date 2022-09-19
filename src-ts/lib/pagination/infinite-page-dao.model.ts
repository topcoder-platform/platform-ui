export interface InfinitePageDao<T> {
    count: number
    // TODO: rename this 'items' so it can be used in a grid/card view
    rows: ReadonlyArray<T>
}
