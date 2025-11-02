import { forwardRef, SelectHTMLAttributes } from 'react'
import classNames from 'classnames'

interface BasicSelectProps<T> extends SelectHTMLAttributes<T> {
    options: { label: string; value: string|boolean|number }[];
    mapValue?: (value: any) => string;
    placeholder?: string;
}

const BasicSelect = forwardRef<HTMLSelectElement, BasicSelectProps<any>>((
    props,
    ref,
) => {
    const { className, options, placeholder, value, mapValue: _mapValue, ...rest } = props

    const normalizedValue = value === null || value === undefined ? '' : value

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
            value={normalizedValue as any}
        >
            <option
                key='placeholder-option'
                disabled
                value=''
            >
                {placeholder}
            </option>
            {options.map((option, index) => (
                <option
                    key={`${option.value ?? option.label ?? index}-${index}`}
                    value={`${option.value ?? ''}`}
                >
                    {option.label}
                </option>
            ))}
        </select>
    )
})

BasicSelect.displayName = 'BasicSelect'

export default BasicSelect
