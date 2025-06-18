/**
 * Use to manage table filter
 */
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import _ from 'lodash'

import { Sort } from '~/apps/gamification-admin/src/game-lib'

import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'
import { checkIsDateObject, checkIsNumberObject, checkIsStringNumeric } from '../utils'

export interface useTableFilterLocalProps<T> {
    page: number
    setPage: Dispatch<SetStateAction<number>>
    totalPages: number
    results: T[]
    setSort: Dispatch<SetStateAction<Sort | undefined>>
    sort: Sort | undefined
}

/**
 * Use to manage table filter
 * @param allDatas all table datas
 * @param defaultSort default sort
 * @param mappingSortField mapping from property field to sort field
 */
export function useTableFilterLocal<T>(
    allDatas: T[],
    defaultSort?: Sort,
    mappingSortField?: { [key: string]: string },
): useTableFilterLocalProps<T> {
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState<Sort | undefined>(defaultSort)
    const [results, setResults] = useState<T[]>([])
    const [displayDatas, setDisplayDatas] = useState<T[]>([])
    const totalPages = useMemo(
        () => Math.ceil(displayDatas.length / TABLE_PAGINATION_ITEM_PER_PAGE),
        [displayDatas],
    )
    const [sortedDatas, setSortedDatas] = useState<T[]>([])

    // update filter datas
    useEffect(() => {
        setSort(defaultSort) // reset sort
        setPage(1) // reset pagination when changing sort
        setDisplayDatas(allDatas)
    }, [allDatas, defaultSort])

    // update sort datas
    useEffect(() => {
        let datas = displayDatas
        if (sort && sort.fieldName && sort.direction && datas.length > 0) {
            let sortField = sort.fieldName
            if (mappingSortField && mappingSortField[sortField]) {
                sortField = mappingSortField[sortField]
            }

            let isNumberString = false
            let isDateObject = false
            let isNumberObject = false
            _.forEach(datas, data => {
                const value = (data as Record<string, any>)[sortField]
                if (value) {
                    isNumberString = checkIsStringNumeric(value)
                    isDateObject = checkIsDateObject(value)
                    isNumberObject = checkIsNumberObject(value)
                    // eslint-disable-next-line no-useless-return
                    return
                }
            })

            datas = [...datas].sort((a, b) => {
                let aValue = (a as Record<string, any>)[sortField]
                let bValue = (b as Record<string, any>)[sortField]

                if (isNumberString) {
                    aValue = Number(aValue)
                    bValue = Number(bValue)
                }

                if (isDateObject || isNumberObject || isNumberString) {
                    let compareValue = 0
                    if (aValue > bValue) {
                        compareValue = 1
                    } else if (aValue < bValue) {
                        compareValue = -1
                    }

                    return sort.direction === 'asc'
                        ? compareValue
                        : -compareValue
                }

                // Existing string comparison logic
                return sort.direction === 'asc'
                    ? String(aValue)
                        .localeCompare(String(bValue))
                    : String(bValue)
                        .localeCompare(String(aValue))
            })
        }

        setSortedDatas(datas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayDatas, sort])

    // update pagination datas
    useEffect(() => {
        let datas = sortedDatas
        if (!datas.length) {
            setResults([])
        } else {
            const pageFrom0 = (page || 1) - 1
            const itemOffset
                = (pageFrom0 * TABLE_PAGINATION_ITEM_PER_PAGE) % datas.length
            datas = _.take(
                _.drop(datas, itemOffset),
                TABLE_PAGINATION_ITEM_PER_PAGE,
            )
            setResults(datas)
        }
    }, [sortedDatas, page])

    return {
        page,
        results,
        setPage,
        setSort,
        sort,
        totalPages,
    }
}
