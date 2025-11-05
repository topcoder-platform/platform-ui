import { forwardRef, SelectHTMLAttributes } from 'react'
import classNames from 'classnames'

interface BasicSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options: { label: string; value: string | boolean | number }[];
    mapValue?: (value: string | number | boolean | '') => string;
    placeholder?: string;
}

const BasicSelect = forwardRef<HTMLSelectElement, BasicSelectProps>((
    props: BasicSelectProps,
    ref,
) => {
    const {
        className,
        options,
        placeholder,
        value,
        mapValue,
        ...rest
    }: BasicSelectProps = props

    const normalizedValue = value === null || value === undefined ? '' : String(value)
    const displayValue = typeof mapValue === 'function'
        ? mapValue(normalizedValue)
        : normalizedValue

    return (
        <select
            ref={ref}
            {...rest}
            className={
                classNames(
                    className,
                    !normalizedValue && `${normalizedValue}` !== 'false' && 'empty',
                )
            }
            value={displayValue}
        >
            <option
                key='placeholder-option'
                disabled
                value=''
            >
                {placeholder}
            </option>
            {options.map(option => (
                <option
                    key={String(option.value ?? option.label)}
                    value={String(option.value ?? '')}
                >
                    {option.label}
                </option>
            ))}
        </select>
    )
})

BasicSelect.displayName = 'BasicSelect'

export default BasicSelect
