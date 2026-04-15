/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import { Pagination } from './Pagination'

jest.mock('../../constants', () => ({
    PAGINATION_PER_PAGE_OPTIONS: [5, 10, 20, 25, 50],
}))
jest.mock('~/apps/admin/src/lib', () => ({
    Pagination: (props: { page: number; totalPages: number }) => (
        <div data-testid='base-pagination'>
            {props.page}
            /
            {props.totalPages}
        </div>
    ),
}), {
    virtual: true,
})

describe('Pagination', () => {
    it('renders the active per-page value when it matches the projects page size', () => {
        render(
            <Pagination
                itemLabel='projects'
                page={1}
                perPage={20}
                total={45}
                onPageChange={jest.fn()}
                onPerPageChange={jest.fn()}
            />,
        )

        expect((screen.getByLabelText('Rows per page') as HTMLSelectElement).value)
            .toBe('20')
        expect(screen.getByText('Showing 1-20 of 45 projects'))
            .toBeTruthy()
    })

    it('calls onPerPageChange with the selected value', () => {
        const onPerPageChange = jest.fn()

        render(
            <Pagination
                itemLabel='projects'
                page={1}
                perPage={20}
                total={45}
                onPageChange={jest.fn()}
                onPerPageChange={onPerPageChange}
            />,
        )

        fireEvent.change(screen.getByLabelText('Rows per page'), {
            target: {
                value: '25',
            },
        })

        expect(onPerPageChange)
            .toHaveBeenCalledWith(25)
    })
})
