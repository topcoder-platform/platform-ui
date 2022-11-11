import { set } from 'lodash'

export interface LearnResponseModel {
    createdAt?: string | Date
    publishedAt?: string | Date
    updatedAt?: string | Date
}

export function create<T extends LearnResponseModel>(item: T): T {

    if (typeof item?.createdAt === 'string') {
        set(item, 'createdAt', new Date(item.createdAt))
    }

    if (typeof item?.updatedAt === 'string') {
        set(item, 'updatedAt', new Date(item.updatedAt))
    }

    if (typeof item?.publishedAt === 'string') {
        set(item, 'publishedAt', new Date(item.publishedAt))
    }

    return item
}
