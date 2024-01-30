/* eslint-disable react/no-array-index-key */

import React from 'react'

import { Column } from '../../models/Column'

interface GenericTableProps {
    columns: Column[];
    data: any[];
}

const GenericTable: React.FC<GenericTableProps> = (props: GenericTableProps) => (
    <table>
        <thead>
            <tr>
                {props.columns.map((column, index) => (
                    <th key={index}>{column.Header}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {props.data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                    {props.columns.map((column, columnIndex) => {
                        const cellValue = row[column.accessor]
                        const CellRenderer = column.Cell
                        return (
                            <td key={columnIndex}>
                                {CellRenderer ? <CellRenderer row={row} /> : cellValue}
                            </td>
                        )
                    })}
                </tr>
            ))}
        </tbody>
    </table>
)

export default GenericTable
