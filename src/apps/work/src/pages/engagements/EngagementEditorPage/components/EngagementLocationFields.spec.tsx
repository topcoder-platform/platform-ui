/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
} from '@testing-library/react'
import moment from 'moment-timezone'

import { EngagementLocationFields } from './EngagementLocationFields'

const mockRecordedFields = new Map<string, any>()

jest.mock('../../../../lib/components/form', () => ({
    FormSelectField: function FormSelectField(props: any) {
        mockRecordedFields.set(props.name, props)

        return <div data-testid={props.name}>{props.label}</div>
    },
}))

describe('EngagementLocationFields', () => {
    beforeEach(() => {
        mockRecordedFields.clear()
        jest.spyOn(moment.tz, 'countries')
            .mockReturnValue(['DE', 'US'])
        jest.spyOn(moment.tz, 'names')
            .mockReturnValue(['Europe/Berlin'])
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('prepends Any to the timezone and country option lists', () => {
        render(<EngagementLocationFields />)

        const timezoneField = mockRecordedFields.get('timezones')
        const countryField = mockRecordedFields.get('countries')

        expect(timezoneField.options[0])
            .toEqual({
                label: 'Any',
                value: 'Any',
            })
        expect(countryField.options[0])
            .toEqual({
                label: 'Any',
                value: 'Any',
            })
    })

    it('stores Any as the only selected value when present', () => {
        render(<EngagementLocationFields />)

        const timezoneField = mockRecordedFields.get('timezones')
        const countryField = mockRecordedFields.get('countries')

        expect(timezoneField.toFieldValue([
            {
                label: 'Any',
                value: 'Any',
            },
            {
                label: '(UTC+01:00) Europe/Berlin',
                value: 'Europe/Berlin',
            },
        ]))
            .toEqual(['Any'])
        expect(countryField.toFieldValue([
            {
                label: 'Germany',
                value: 'DE',
            },
            {
                label: 'Any',
                value: 'Any',
            },
        ]))
            .toEqual(['Any'])
        expect(countryField.toFieldValue([
            {
                label: 'Germany',
                value: 'DE',
            },
        ]))
            .toEqual(['DE'])
    })
})
