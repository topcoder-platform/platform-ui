import { BackendMeta } from './BackendMeta.model'

/**
 * Backend model for response with meta data
 */
export interface BackendResponseWithMeta<T> {
    data: T
    meta: BackendMeta
}
