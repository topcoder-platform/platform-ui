import { FC, useEffect, useMemo, useState } from 'react'
import { debounce } from 'lodash'
import classNames from 'classnames'

import { IconOutline, InputWrapper } from '~/libs/ui'

import styles from './SearchInput.module.scss'

interface SearchInputProps {
    value: string
    onChange: (t: string) => void
}

const SearchInput: FC<SearchInputProps> = props => {
    const [value, setValue] = useState(props.value)

    const debouncedOnChange = useMemo(() => debounce((newValue): void => {
        props.onChange.call(undefined, newValue ?? '')
    }, 300), [props.onChange])

    function handleOnChange(ev: any): void {
        const newValue = ev.target.value ?? ''
        setValue(newValue)
        debouncedOnChange(newValue)
    }

    useEffect(() => {
        if (props.value !== value) {
            setValue(props.value)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.value])

    return (
        <div className={styles.wrap}>
            <InputWrapper
                dirty={false}
                disabled={false}
                label=''
                type='text'
            >
                <div className={styles.inputWrapper}>
                    <div className={styles.inputIcon}>
                        <IconOutline.SearchIcon className='icon-lg' />
                    </div>
                    <input
                        className={classNames(styles.inputText, 'body-small')}
                        value={value}
                        onChange={handleOnChange}
                        placeholder='Search Skill'
                        type='text'
                    />
                    {props.value && (
                        <div
                            className={classNames(styles.inputIcon, styles.clearIcon)}
                            onClick={function ch() { props.onChange('') }}
                        >
                            <IconOutline.XIcon className='icon-lg' />
                        </div>
                    )}
                </div>
            </InputWrapper>
        </div>
    )
}

export default SearchInput
