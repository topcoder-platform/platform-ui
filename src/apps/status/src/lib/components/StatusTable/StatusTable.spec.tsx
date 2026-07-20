/* eslint-disable import/no-extraneous-dependencies, react/jsx-no-bind */
import { fireEvent, render, screen } from '@testing-library/react'

import { StatusColumn, StatusTable } from './StatusTable'

interface Row {
    id: string
    label: string
    severity: 'critical' | 'healthy'
}

const columns: StatusColumn<Row>[] = [{
    id: 'label',
    label: 'Service',
    render: row => row.label,
}]

const rows: Row[] = [{ id: 'failure', label: 'Email API', severity: 'critical' }]

describe('StatusTable', () => {
    it('keeps a non-color label and keyboard activation on interactive failure rows', () => {
        const onRowClick = jest.fn()
        render(
            <StatusTable
                caption='Operational services'
                columns={columns}
                getKey={row => row.id}
                getRowLabel={row => `${row.severity}: ${row.label}`}
                getSeverity={row => row.severity}
                onRowClick={onRowClick}
                rows={rows}
            />,
        )

        const desktopRow = screen.getAllByLabelText('critical: Email API')[0]
        fireEvent.keyDown(desktopRow, { key: 'Enter' })

        expect(onRowClick)
            .toHaveBeenCalledWith(expect.objectContaining({ id: 'failure' }))
    })
})
