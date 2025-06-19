export default interface ApiResponse<T> {
    status: 'success' | 'error'
    error?: { code: string; message: string }
    data: T
}
