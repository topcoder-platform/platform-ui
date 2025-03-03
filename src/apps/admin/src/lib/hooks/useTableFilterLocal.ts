/**
 * Use to manage table filter
 */
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import _ from 'lodash'

import { Sort } from '~/apps/gamification-admin/src/game-lib'

import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'

export interface useTableFilterLocalProps<T> {
    page: number
    setPage: Dispatch<SetStateAction<number>>
    totalPages: number
    results: T[]
    setSort: Dispatch<SetStateAction<Sort | undefined>>
}

/**
 * Use to manage table filter
 * @param allDatas all table datas
 * @param defaultSort default sort
 */
export function useTableFilterLocal<T>(allDatas: T[], defaultSort?: Sort): useTableFilterLocalProps<T> {
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState<Sort | undefined>(defaultSort)
    const totalPages = useMemo(
        () => Math.ceil(allDatas.length / TABLE_PAGINATION_ITEM_PER_PAGE),
        [allDatas],
    )
    const [results, setResults] = useState<T[]>([])

    useEffect(() => {
        let datas = allDatas
        if (!datas.length) {
            setResults([])
        } else {
            if (sort && sort.fieldName && sort.direction) {
                datas = _.orderBy(datas, [sort.fieldName], [sort.direction])
            }

            const pageFrom0 = (page || 1) - 1
            const itemOffset
                = (pageFrom0 * TABLE_PAGINATION_ITEM_PER_PAGE) % datas.length
            datas = _.take(
                _.drop(datas, itemOffset),
                TABLE_PAGINATION_ITEM_PER_PAGE,
            )
            setResults(datas)
        }
    }, [allDatas, page, sort])

    return {
        page,
        results,
        setPage,
        setSort,
        totalPages,
    }
}
