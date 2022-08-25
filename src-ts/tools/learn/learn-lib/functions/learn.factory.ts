export interface LearnResponseModel {
    createdAt?: string | Date
    updatedAt?: string | Date
}

export function create<T extends LearnResponseModel>(item: T): T {

    if (typeof item?.createdAt === 'string') {
        item.createdAt = new Date(item.createdAt)
    }
    if (typeof item?.updatedAt === 'string') {
        item.updatedAt = new Date(item.updatedAt)
    }

    return item
}
