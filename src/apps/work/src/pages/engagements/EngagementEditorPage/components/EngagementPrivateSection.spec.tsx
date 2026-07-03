/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import type {
    FC,
    PropsWithChildren,
} from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'
import { MemoryRouter } from 'react-router-dom'

import {
    EngagementPrivateSection,
} from './EngagementPrivateSection'

jest.mock('../../../../lib/components/form', () => {
    const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')

    return {
        FormCheckboxField: function FormCheckboxField(props: {
            disabled?: boolean
            label: string
            name: string
        }) {
            const controller = reactHookForm.useController({
                control: reactHookForm.useFormContext().control,
                name: props.name,
            })

            return (
                <label htmlFor={props.name}>
                    {props.label}
                    <input
                        checked={controller.field.value === true}
                        disabled={props.disabled}
                        id={props.name}
                        onBlur={controller.field.onBlur}
                        onChange={event => controller.field.onChange(event.target.checked)}
                        type='checkbox'
                    />
                </label>
            )
        },
        FormUserAutocomplete: function FormUserAutocomplete(props: {
            label: string
            name: string
            onValueChange?: (value: string) => void
        }) {
            const controller = reactHookForm.useController({
                control: reactHookForm.useFormContext().control,
                name: props.name,
            })

            return (
                <label htmlFor={props.name}>
                    {props.label}
                    <input
                        id={props.name}
                        onBlur={controller.field.onBlur}
                        onChange={event => {
                            controller.field.onChange(event.target.value)
                            props.onValueChange?.(event.target.value)
                        }}
                        type='text'
                        value={controller.field.value || ''}
                    />
                </label>
            )
        },
    }
})

jest.mock('../../../../lib/utils', () => ({
    formatAssignmentCurrency: (value?: string): string => (value ? `$${value}` : ''),
    getAssignmentPaymentCycle: (): string => 'Weekly',
    getAssignmentStandardHoursPerDay: (detail: { standardHoursPerDay?: string }): string => (
        detail.standardHoursPerDay || ''
    ),
}))

jest.mock('../../../../lib/utils/payment.utils', () => ({
    formatCurrency: (value?: string): string => (value ? `$${value}` : ''),
}))

jest.mock('./AssignmentDetailsModal', () => ({
    AssignmentDetailsModal: (): JSX.Element => <></>,
}))

interface TestFormValues {
    assignedMemberHandles: string[]
    assignmentDetails: Array<{
        agreementRate: string
        durationMonths: string
        memberHandle: string
        otherRemarks?: string
        ratePerHour: string
        standardHoursPerWeek: string
        startDate: string
    }>
    isPrivate: boolean
    requiredMemberCount: number | string
}

const defaultAssignmentDetails = {
    agreementRate: '800',
    durationMonths: '3',
    memberHandle: 'assigned_member',
    otherRemarks: 'active notes',
    ratePerHour: '20',
    standardHoursPerDay: '8',
    standardHoursPerWeek: '40',
    startDate: '2026-05-01T00:00:00.000Z',
}

function renderPrivateSection(
    defaultValues: TestFormValues,
    props: {
        assignmentManagementPath?: string
        lockedAssignedMemberHandles?: string[]
    } = {},
): void {
    const FormWrapper: FC<PropsWithChildren> = (wrapperProps: PropsWithChildren) => {
        const methods = useForm<TestFormValues>({
            defaultValues,
        })

        return (
            <MemoryRouter>
                <FormProvider {...methods}>
                    {wrapperProps.children}
                </FormProvider>
            </MemoryRouter>
        )
    }

    render(
        <FormWrapper>
            <EngagementPrivateSection {...props} />
        </FormWrapper>,
    )
}

describe('EngagementPrivateSection', () => {
    it('renders existing assigned members as read-only assignment rows', () => {
        renderPrivateSection({
            assignedMemberHandles: ['assigned_member'],
            assignmentDetails: [defaultAssignmentDetails],
            isPrivate: true,
            requiredMemberCount: 1,
        }, {
            assignmentManagementPath: '/projects/123/engagements/engagement-1/assignments',
            lockedAssignedMemberHandles: ['assigned_member'],
        })

        expect(screen.getByText('assigned_member'))
            .not
            .toBeNull()
        expect(screen.queryByLabelText('Assign to Member'))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'Edit' }))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'Add Details' }))
            .toBeNull()
        expect((screen.getByLabelText('Private engagement') as HTMLInputElement).disabled)
            .toBe(true)
        expect(screen.getByRole('link', { name: 'Assignments' })
            .getAttribute('href'))
            .toBe('/projects/123/engagements/engagement-1/assignments')
    })

    it('keeps empty member slots editable before a member is assigned', () => {
        renderPrivateSection({
            assignedMemberHandles: [''],
            assignmentDetails: [],
            isPrivate: true,
            requiredMemberCount: 1,
        })

        expect(screen.getByLabelText('Assign to Member'))
            .not
            .toBeNull()
        expect((screen.getByRole('button', { name: 'Add Details' }) as HTMLButtonElement).disabled)
            .toBe(true)
        expect((screen.getByLabelText('Private engagement') as HTMLInputElement).disabled)
            .toBe(false)
    })
})
