/**
 * Use to manage table selection
 */
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import _ from 'lodash'

type KeyType = string | number

export interface useTableSelectionProps<T extends KeyType> {
    selectedDatas: {
        [id: KeyType]: boolean
    }
    selectedDatasArray: T[],
    toggleSelect: (key: T) => void
    forceSelect: (key: T) => void
    forceUnSelect: (key: T) => void
    toggleSelectAll: () => void
    unselectAll: () => void
    hasSelected: boolean
    isSelectAll: boolean
}

/**
 * Use to manage table selection
 * @param datasIds datas
 * @returns selection info
 */
export function useTableSelection<T extends KeyType>(
    datasIds: T[],
): useTableSelectionProps<T> {
    const [selectedDatas, setSelectedDatas] = useState<{
        [id: KeyType]: boolean
    }>({})
    const selectedDatasArray = useMemo(
        () => _.filter(
            _.keys(selectedDatas) as T[],
            item => selectedDatas[item] === true,
        ),
        [selectedDatas],
    )
    const hasSelected = useMemo(
        () => selectedDatasArray.length > 0,
        [selectedDatasArray],
    )
    const isSelectAll = useMemo(
        () => selectedDatasArray.length === datasIds.length,
        [selectedDatasArray, datasIds],
    )

    const toggleSelect = useCallback(
        (key: T) => {
            setSelectedDatas(old => ({
                ...old,
                [key]: !old[key],
            }))
        },
        [],
    )
    const forceSelect = useCallback(
        (key: T) => {
            setSelectedDatas(old => ({
                ...old,
                [key]: true,
            }))
        },
        [],
    )
    const forceUnSelect = useCallback(
        (key: T) => {
            setSelectedDatas(old => ({
                ...old,
                [key]: false,
            }))
        },
        [],
    )

    const unselectAll = useCallback(() => {
        setSelectedDatas({})
    }, [])

    const selectAll = useCallback(() => {
        setSelectedDatas(
            _.reduce(
                datasIds,
                (selectedData, data) => ({ ...selectedData, [data]: true }),
                {},
            ),
        )
    }, [datasIds])

    const toggleSelectAll = useCallback(() => {
        if (isSelectAll) {
            unselectAll()
        } else {
            selectAll()
        }
    }, [isSelectAll, unselectAll, selectAll])

    // reset select
    useEffect(() => {
        unselectAll()
    }, [datasIds, unselectAll])

    return {
        forceSelect,
        forceUnSelect,
        hasSelected,
        isSelectAll,
        selectedDatas,
        selectedDatasArray,
        toggleSelect,
        toggleSelectAll,
        unselectAll,
    }
}
