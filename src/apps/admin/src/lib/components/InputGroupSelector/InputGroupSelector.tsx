/**
 * Input handles selector.
 */
import { FC, useMemo } from 'react'
import ReactSelect, { MultiValue, MultiValueProps } from 'react-select'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { SelectOption } from '../../models'

import styles from './InputGroupSelector.module.scss'

interface Props {
    label?: string
    className?: string
    placeholder?: string
    readonly value?: SelectOption[]
    readonly onChange?: (event: SelectOption[]) => void
    readonly disabled?: boolean
    readonly isLoading?: boolean
    readonly options: SelectOption[]
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

export const InputGroupSelector: FC<Props> = (props: Props) => {
    const components = useMemo(
        () => ({
            DropdownIndicator: undefined,
            MultiValue: CustomMultiValue,
        }),
        [],
    )

    return (
        <div className={classNames(styles.container, props.className)}>
            <div className={styles.selectUserHandlesTitle}>
                {props.label ?? 'Group IDs'}
            </div>
            <ReactSelect
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
                            label: v.label,
                            value: v.value,
                        })),
                    )
                }}
                value={props.value}
                options={props.options}
                isDisabled={props.disabled}
                isLoading={props.isLoading}
            />
        </div>
    )
}

export default InputGroupSelector
