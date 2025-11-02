/**
 * Field client select.
 */
import { FC } from 'react'

import { ClientInfo, SelectOption } from '../../models'
import { FieldSingleSelectAsync } from '../FieldSingleSelectAsync'
import { searchClients } from '../../services'

async function autoCompleteDatas(rawQueryTerm: string): Promise<ClientInfo[]> {
    const queryTerm = rawQueryTerm.trim()
    if (!queryTerm) {
        return Promise.resolve([])
    }

    const result = await searchClients(
        {
            name: queryTerm,
            status: 'ACTIVE',
        },
        {
            limit: 10,
            page: 1,
            sort: 'name asc',
        },
    )
    return result.content
}

const fetchDatas = (
    queryTerm: string,
    callback: (options: SelectOption[]) => void,
): void => {
    autoCompleteDatas(queryTerm)
        .then(datas => {
            callback(
                datas.map(data => ({
                    label: data.name,
                    value: data.id,
                })),
            )
        })
        .catch(() => {
            callback([])
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
}

export const FieldClientSelect: FC<Props>
    = (props: Props) => (<FieldSingleSelectAsync {...props} loadOptions={fetchDatas} />)

export default FieldClientSelect
