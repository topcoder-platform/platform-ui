import { ApiError } from './ApiError'

export default interface ApiResponse<T> {
    status: 'success' | 'error'
    data: T
    error: ApiError
}
