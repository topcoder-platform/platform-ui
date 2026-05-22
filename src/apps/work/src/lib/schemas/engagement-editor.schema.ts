import * as yup from 'yup'

interface EngagementEditorSchemaAssignmentDetails {
    agreementRate?: string
    durationMonths?: number | string
    memberHandle?: string
    paymentCycle?: string
    ratePerHour?: string
    startDate?: string
    standardHoursPerDay?: number | string
    standardHoursPerWeek?: number | string
}

export interface EngagementEditorSchemaData {
    anticipatedStart: string
    assignedMemberHandles?: string[]
    assignmentDetails?: EngagementEditorSchemaAssignmentDetails[]
    countries: string[]
    description: string
    durationWeeks: number
    isPrivate: boolean
    requiredMemberCount?: number
    skills: unknown[]
    status: string
    timezones: string[]
    title: string
}

function emptyStringToUndefined(value: unknown, originalValue: unknown): unknown {
    if (originalValue === '') {
        return undefined
    }

    return value
}

/**
 * Normalizes a member handle from the form so private-assignment validation
 * consistently compares trimmed values.
 *
 * @param value raw form value for a member handle.
 * @returns trimmed handle or an empty string when the value is blank.
 */
function normalizeHandle(value: unknown): string {
    return typeof value === 'string'
        ? value.trim()
        : ''
}

/**
 * Resolves the expected private-assignment slot count from the form.
 *
 * @param value raw required-member-count form value.
 * @returns positive integer slot count or `undefined` when the value is invalid.
 */
function toPositiveInteger(value: unknown): number | undefined {
    const parsedValue = Number(value)

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        return undefined
    }

    return parsedValue
}

/**
 * Validates the decimal input rules used by the assignment-details modal.
 *
 * @param value raw numeric form value.
 * @param maxDecimalPlaces maximum supported decimal precision.
 * @returns `true` when the value is a positive decimal matching the precision.
 */
function isPositiveDecimal(value: unknown, maxDecimalPlaces?: number): boolean {
    if (value === undefined || value === null) {
        return false
    }

    const normalizedValue = String(value)
        .trim()

    if (!normalizedValue) {
        return false
    }

    const decimalPattern = maxDecimalPlaces === undefined
        ? /^(?:\d+|\d*\.\d+)$/
        : new RegExp(`^(?:\\d+|\\d*\\.\\d{1,${maxDecimalPlaces}})$`)

    if (!decimalPattern.test(normalizedValue)) {
        return false
    }

    return Number(normalizedValue) > 0
}

/**
 * Checks whether a private-assignment detail entry is complete for the selected
 * member handle before the form can be submitted.
 *
 * @param detail assignment details saved for the slot.
 * @param memberHandle selected member handle for the slot.
 * @returns `true` when all required fields are present and aligned to the slot.
 */
function hasCompleteAssignmentDetails(
    detail: EngagementEditorSchemaAssignmentDetails | undefined,
    memberHandle: string,
): boolean {
    if (!detail) {
        return false
    }

    const startDate = detail.startDate
    const parsedStartDate = startDate
        ? new Date(startDate)
        : undefined

    return normalizeHandle(detail.memberHandle) === memberHandle
        && !!startDate
        && !!parsedStartDate
        && !Number.isNaN(parsedStartDate.getTime())
        && toPositiveInteger(detail.durationMonths) !== undefined
        && isPositiveDecimal(detail.ratePerHour)
        && isPositiveDecimal(detail.standardHoursPerDay, 2)
        && ['WEEKLY', 'FORTNIGHTLY', 'MONTHLY'].includes(
            String(detail.paymentCycle || 'WEEKLY')
                .trim()
                .toUpperCase(),
        )
}

export const engagementEditorSchema: yup.ObjectSchema<EngagementEditorSchemaData> = yup.object({
    anticipatedStart: yup
        .string()
        .required('Anticipated start is required'),
    assignedMemberHandles: yup
        .array()
        .of(yup.string()
            .required())
        .when('isPrivate', {
            is: true,
            otherwise: schema => schema.optional(),
            then: schema => schema.test(
                'private-assignment-count',
                'Assign to Member is required',
                function validateAssignedMembers(value: unknown[] | undefined) {
                    const requiredMemberCount = toPositiveInteger(this.parent.requiredMemberCount)
                    const normalizedHandles = Array.isArray(value)
                        ? value.map(normalizeHandle)
                        : []

                    if (requiredMemberCount === undefined) {
                        if (normalizedHandles.some(Boolean)) {
                            return true
                        }

                        return this.createError({
                            message: 'Assign to Member is required',
                        })
                    }

                    const requiredHandles = normalizedHandles.slice(0, requiredMemberCount)

                    if (
                        requiredHandles.length === requiredMemberCount
                        && requiredHandles.every(Boolean)
                    ) {
                        return true
                    }

                    return this.createError({
                        message: requiredMemberCount === 1
                            ? 'Assign to Member is required'
                            : `All ${requiredMemberCount} member assignments are required for private engagements`,
                    })
                },
            ),
        }),
    assignmentDetails: yup
        .array()
        .optional()
        .when('isPrivate', {
            is: true,
            otherwise: schema => schema.optional(),
            then: schema => schema.test(
                'private-assignment-details',
                'Assignment details are required for the assigned member.',
                function validateAssignmentDetails(value: EngagementEditorSchemaAssignmentDetails[] | undefined) {
                    const normalizedHandles = Array.isArray(this.parent.assignedMemberHandles)
                        ? this.parent.assignedMemberHandles.map(normalizeHandle)
                        : []
                    const requiredMemberCount = toPositiveInteger(this.parent.requiredMemberCount)
                        || normalizedHandles.filter(Boolean).length
                    const requiredHandles = normalizedHandles.slice(0, requiredMemberCount)

                    if (!requiredHandles.length || !requiredHandles.every(Boolean)) {
                        return true
                    }

                    const assignmentDetails = Array.isArray(value)
                        ? value
                        : []

                    const hasCompleteDetails = requiredHandles.every((memberHandle: string, index: number) => (
                        hasCompleteAssignmentDetails(assignmentDetails[index], memberHandle)
                    ))

                    if (hasCompleteDetails) {
                        return true
                    }

                    return this.createError({
                        message: requiredMemberCount === 1
                            ? 'Assignment details are required for the assigned member.'
                            : `Assignment details are required for all ${requiredMemberCount} assigned members.`,
                    })
                },
            ),
        }),
    countries: yup
        .array()
        .of(yup.string()
            .required())
        .min(1, 'Select at least one country')
        .required('Select at least one country'),
    description: yup
        .string()
        .required('Description is required'),
    durationWeeks: yup
        .number()
        .typeError('Duration is required')
        .required('Duration is required')
        .integer('Duration must be a whole number')
        .min(4, 'Duration must be at least 4 weeks'),
    isPrivate: yup
        .boolean()
        .required(),
    requiredMemberCount: yup
        .number()
        .transform(emptyStringToUndefined)
        .typeError('Required members must be a number')
        .integer('Required members must be a whole number')
        .min(1, 'Required members must be at least 1')
        .when('isPrivate', {
            is: true,
            otherwise: schema => schema.optional(),
            then: schema => schema
                .required('Required members is required'),
        }),
    skills: yup
        .array()
        .min(1, 'Select at least one skill')
        .required('Select at least one skill'),
    status: yup
        .string()
        .required('Status is required'),
    timezones: yup
        .array()
        .of(yup.string()
            .required())
        .min(1, 'Select at least one timezone')
        .required('Select at least one timezone'),
    title: yup
        .string()
        .required('Title is required'),
})
    .required()
