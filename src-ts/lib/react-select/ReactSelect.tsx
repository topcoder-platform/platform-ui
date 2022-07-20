import React from 'react'
import Select, { GroupBase, OptionsOrGroups } from 'react-select'

import styles from './ReactSelect.module.scss'

interface ReactSelectProps {
    disabled?: boolean
    error?: string
    isMulti?: boolean
    noOptionsText?: string
    onBlur?: () => void
    onChange?: (value: any) => void
    onFocus?: () => void
    onInputChange?: () => void
    readonly options: OptionsOrGroups<unknown, GroupBase<unknown>>
    placeholder?: string
    style2?: boolean
    value?: unknown
}

const ReactSelect: React.FC<ReactSelectProps> = (props) => {
   const customStyles: any = {
     control: (provided: any, state: any) => ({
        ...provided,
        border: props.style2 ? '0' : '1px solid #aaaaab',
        borderColor: state.isFocused ? '#55a5ff' : '#aaaaab',
        boxShadow: props.style2
            ? 'none'
            : state.isFocused
            ? '0 0 2px 1px #cee6ff'
            : provided.boxShadow,
        minHeight: '22px',
    }),
     indicatorContainer: (provided: any) => ({
        padding: '0',
    }),
     indicatorSeparator: () => ({
        display: 'none',
    }),
     indicatorsContainer: (provided: any) => ({
        ...provided,
        height: '30px',
        marginTop: '-5px',
        width: '30px',
    }),
     input: (provided: any) => ({
        ...provided,
        fontSize: props.style2 ? '20px' : '14px',
        height: '22px',
        margin: '0px',
        padding: '0',
    }),
     menu: (provided: any) => ({
        ...provided,
        minHeight: '40px',
        zIndex: 10,
    }),
     multiValue: (provided: any) => ({
        ...provided,
        borderRadius: '5px',
        color: '#AAAAAA',
        fontFamily: 'Roboto',
        fontSize: '14px',
        lineHeight: '22px',
        margin: '3px 3px',
        textAlign: 'left',
    }),
     option: (provided: any) => ({
        ...provided,
        minHeight: '32px',
    }),
     placeholder: (provided: any) => ({
        ...provided,
        color: '#AAAAAA',
        fontFamily: 'Roboto',
        fontSize: '14px',
        fontWeight: '400',
        lineHeight: '22px',
        marginTop: '0',
        paddingLeft: '0',
        textAlign: 'left',
    }),
     singleValue: (provided: any) => ({
        ...provided,
        color: '#7F7F7F',
        fontSize: '14px',
        lineHeight: '24px',
        marginLeft: 0,
    }),
     valueContainer: (provided: any) => ({
        ...provided,
        padding: 0,
     }),
   }

   return (
        <div className={styles['select-wrapper']}>
            <Select
                options={props.options}
                value={props.value}
                styles={customStyles}
                onChange={props.onChange}
                className={props.error ? styles['error'] : ''}
                isMulti={props.isMulti}
                onBlur={props.onBlur}
                onFocus={props.onFocus}
                placeholder={props.placeholder}
                onInputChange={props.onInputChange}
                noOptionsMessage={() => props.noOptionsText}
                isDisabled={props.disabled}
            />
        </div>
   )
 }

export default ReactSelect
