import React, { useState } from 'react'

type DropdownOption = {
    label: string
    value: string
}

interface FilterBarProps {
    filters: DropdownOption[][] }

const FilterBar: React.FC<FilterBarProps> = (props: FilterBarProps) => {
    const [selectedValues, setSelectedValues] = useState<string[]>(new Array(props.filters.length)
        .fill(''))

    const handleDropdownChange = (value: string, index: number): void => {
        const updatedValues = [...selectedValues]
        updatedValues[index] = value
        setSelectedValues(updatedValues)
    }

    const handleClearFilters = (): void => {
        setSelectedValues(new Array(props.filters.length)
            .fill(''))
    }

    return (
        <div>
            {props.filters.map((options, index) => (
                <select
                    key={index}
                    value={selectedValues[index]}
                    onChange={e => handleDropdownChange(e.target.value, index)}
                >
                    <option value=''>Select...</option>
                    {options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ))}
            <button onClick={handleClearFilters}>Clear Filters</button>
        </div>
    )
}

export default FilterBar
