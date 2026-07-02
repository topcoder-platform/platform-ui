import * as yup from 'yup'

import { engagementEditorSchema, EngagementEditorSchemaData } from './engagement-editor.schema'

function createValidFormValues(): EngagementEditorSchemaData {
    return {
        anticipatedStart: 'IMMEDIATE',
        assignedMemberHandles: [],
        assignmentDetails: [],
        countries: ['US'],
        description: 'Build a new work app experience',
        durationWeeks: 4,
        isPrivate: false,
        requiredMemberCount: undefined,
        skills: [{
            id: 'skill-1',
            name: 'React',
        }],
        status: 'Open',
        timezones: ['UTC'],
        title: 'Senior Frontend Engineer',
    }
}

/**
 * Collects all validation messages so tests can assert on the private
 * assignment requirements without relying on abort-early behavior.
 *
 * @param values candidate engagement editor form values.
 * @returns validation error messages in the order returned by yup.
 */
async function getValidationMessages(
    values: ReturnType<typeof createValidFormValues>,
): Promise<string[]> {
    try {
        await engagementEditorSchema.validate(values, {
            abortEarly: false,
        })

        return []
    } catch (error) {
        if (!(error instanceof yup.ValidationError)) {
            throw error
        }

        return error.inner.map(validationError => validationError.message)
    }
}

function createAssignmentDetails(
    memberHandle: string,
): NonNullable<EngagementEditorSchemaData['assignmentDetails']>[number] {
    return {
        agreementRate: '3000',
        durationMonths: '3',
        memberHandle,
        ratePerHour: '75',
        standardHoursPerDay: '8',
        standardHoursPerWeek: '40',
        startDate: '2026-04-15T00:00:00.000Z',
    }
}

describe('engagementEditorSchema', () => {
    it('rejects private engagements when an assigned member is missing required assignment details', async () => {
        const validationMessages = await getValidationMessages({
            ...createValidFormValues(),
            assignedMemberHandles: ['testaws1'],
            assignmentDetails: [{
                memberHandle: 'testaws1',
            }],
            isPrivate: true,
            requiredMemberCount: 1,
        })

        expect(validationMessages)
            .toContain(
                'Assignment details are required for the assigned member.',
            )
    })

    it('accepts private engagements without assigned members', async () => {
        await expect(engagementEditorSchema.validate({
            ...createValidFormValues(),
            assignedMemberHandles: [],
            assignmentDetails: [],
            isPrivate: true,
            requiredMemberCount: 2,
        }, {
            abortEarly: false,
        })).resolves.toMatchObject({
            assignedMemberHandles: [],
            isPrivate: true,
        })
    })

    it('accepts private engagements with complete assignment details for assigned members', async () => {
        await expect(engagementEditorSchema.validate({
            ...createValidFormValues(),
            assignedMemberHandles: ['testaws1'],
            assignmentDetails: [createAssignmentDetails('testaws1')],
            isPrivate: true,
            requiredMemberCount: 2,
        }, {
            abortEarly: false,
        })).resolves.toMatchObject({
            assignedMemberHandles: ['testaws1'],
            isPrivate: true,
        })
    })
})
