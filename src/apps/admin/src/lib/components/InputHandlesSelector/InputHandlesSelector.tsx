/**
 * Input handles selector.
 */
import {
    FC,
    useMemo,
} from 'react'
import { MultiValue, MultiValueProps } from 'react-select'
import _ from 'lodash'
import AsyncSelect from 'react-select/async'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { SearchUserInfo, SelectOption } from '../../models'
import { getMemberSuggestionsByHandle } from '../../services'

import styles from './InputHandlesSelector.module.scss'

interface Props {
    label?: string
    className?: string
    placeholder?: string
    readonly value?: SearchUserInfo[]
    readonly onChange?: (event: SearchUserInfo[]) => void
    readonly disabled?: boolean
}

const CustomMultiValue = (
    props: MultiValueProps<SelectOption, true>,
): JSX.Element => (
    <div className={classNames(styles.selectUserHandlesCustomMultiValue)}>
        <span className={styles.label}>{props.data.label}</span>
        <span {...props.removeProps} className={styles.removeIcon}>
            <IconOutline.XIcon className='icon icon-fill' />
        </span>
    </div>
)

const mapDataToInputOption = (data: SearchUserInfo): SelectOption => ({
    ...data,
    label: data.handle,
    value: data.userId,
})

async function autoCompleteDatas(queryTerm: string): Promise<SearchUserInfo[]> {
    if (!queryTerm) {
        return Promise.resolve([])
    }

    return getMemberSuggestionsByHandle(queryTerm)
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

const fetchDatasDebounce = _.debounce(fetchDatas, 300)

export const InputHandlesSelector: FC<Props> = (props: Props) => {
    const components = useMemo(
        () => ({
            DropdownIndicator: undefined,
            MultiValue: CustomMultiValue,
        }),
        [],
    )

    return (
        <div className={classNames(styles.container, props.className)}>
            <div className={styles.selectUserHandlesTitle}>{props.label ?? 'Handle'}</div>
            <AsyncSelect
                components={components}
                isClearable
                isMulti
                placeholder={props.placeholder ?? 'Enter'}
                menuPortalTarget={document.body}
                classNames={{
                    container: () => styles.select,
                    menuPortal: () => styles.selectUserHandlesDropdownContainer,
                }}
                classNamePrefix={styles.sel}
                onChange={function onChange(value: MultiValue<SelectOption>) {
                    props.onChange?.(
                        value.map(v => ({
                            handle: v.label as string,
                            userId: v.value as number,
                        })),
                    )
                }}
                value={props.value?.map(mapDataToInputOption)}
                loadOptions={fetchDatasDebounce}
                isDisabled={props.disabled}
            />
        </div>
    )
}

export default InputHandlesSelector
