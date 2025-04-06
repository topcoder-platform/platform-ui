/**
 * Field Single Handle Select.
 */
import { FC, FocusEvent } from 'react'

import { SearchUserInfo, SelectOption } from '../../models'
import { FieldSingleSelectAsync } from '../FieldSingleSelectAsync'
import { getMemberSuggestionsByHandle } from '../../services'

async function autoCompleteDatas(queryTerm: string): Promise<SearchUserInfo[]> {
    if (!queryTerm) {
        return Promise.resolve([])
    }

    const result = await getMemberSuggestionsByHandle(queryTerm)
    return result
}

const fetchDatas = (
    queryTerm: string,
    callback: (options: SelectOption[]) => void,
): void => {
    autoCompleteDatas(queryTerm)
        .then(datas => {
            callback(
                datas.map(data => ({
                    label: data.handle,
                    value: data.userId,
                })),
            )
        })
}

interface Props {
    label?: string
    className?: string
    placeholder?: string
    readonly value?: SelectOption
    readonly onChange?: (event: SelectOption) => void
    readonly disabled?: boolean
    readonly error?: string
    readonly dirty?: boolean
    readonly onBlur?: (event: FocusEvent<HTMLInputElement>) => void
    readonly isLoading?: boolean
}

export const FieldHandleSelect: FC<Props> = (props: Props) => (
    <FieldSingleSelectAsync
        {...props}
        loadOptions={fetchDatas}
        placeholder={
            props.placeholder ?? 'Enter handle you are searching for...'
        }
    />
)

export default FieldHandleSelect
