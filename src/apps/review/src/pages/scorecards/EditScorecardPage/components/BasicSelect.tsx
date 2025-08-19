import classNames from 'classnames';
import { omit } from 'lodash';
import { FC, SelectHTMLAttributes } from 'react'

interface BasicSelectProps<T> extends SelectHTMLAttributes<T> {
    options: { label: string; value: string|boolean|number }[];
    placeholder?: string;
}

const BasicSelect: FC<BasicSelectProps<any>> = props => (
    <select
        {...omit(props, 'options')}
        className={
            classNames(
                props.className,
                !props.value && `${props.value}` !== 'false' && 'empty'
            )
        }
    >
        <option
            disabled
            value=""
        >
            {props.placeholder}
        </option>
        {props.options.map(option => (
            <option
                key={`${option.value}`}
                value={option.value as string}
            >
                {option.label}
            </option>
        ))}
    </select>
)

export default BasicSelect
