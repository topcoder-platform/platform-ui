export default interface ApiResponse<T> {
    status: 'success' | 'error'
    data: T
}
