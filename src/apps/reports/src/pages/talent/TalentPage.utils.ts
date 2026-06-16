export const availabilityLabels: Record<string, string> = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
}

export const preferredRoleLabels: Record<string, string> = {
    AI_ML_ENGINEER: 'AI / ML Engineer',
    AI_PROMPT_ENGINEER: 'AI Prompt Engineer',
    CLOUD_ENGINEER: 'Cloud Engineer / Solutions Architect',
    CYBERSECURITY_ENGINEER: 'Cybersecurity Analyst / Security Engineer',
    DATA_SCIENTIST_ENGINEER: 'Data Scientist / Data Engineer',
    DB_ADMIN: 'Database Administrator',
    DEVOPS_SRE: 'DevOps Engineer / SRE',
    ENTERPRISE_ARCHITECT: 'Enterprise Architect',
    FULL_STACK_DEVELOPER: 'Full-Stack Developer',
    QA_AUTOMATION_ENGINEER: 'QA Lead / Automation Engineer',
    TECHNICAL_PM: 'Technical Project Manager',
    UX_DESIGNER: 'UX Designer',
}

/**
 * Formats a preferred-role value for display.
 * @param role Preferred role value stored in the openToWork trait.
 * @returns Human-readable role label.
 */
export function formatPreferredRole(role: string): string {
    if (preferredRoleLabels[role]) {
        return preferredRoleLabels[role]
    }

    return role
        .toLowerCase()
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map(part => {
            const firstLetter = part.charAt(0)
                .toUpperCase()
            return `${firstLetter}${part.slice(1)}`
        })
        .join(' ')
}

/**
 * Formats an open-to-work availability value for display.
 * @param availability Availability value from the openToWork trait.
 * @returns Human-readable availability label.
 */
export function formatAvailability(availability: string | null | undefined): string {
    if (!availability) {
        return 'Not specified'
    }

    return availabilityLabels[availability] ?? formatPreferredRole(availability)
}

/**
 * Formats an ISO date as a compact member-since label.
 * @param isoDate Date string returned by the reports API.
 * @returns Month/year label, or fallback text when no valid date exists.
 */
export function formatMemberSince(isoDate: string | null | undefined): string {
    if (!isoDate) {
        return 'Not available'
    }

    const parsed = new Date(isoDate)

    if (Number.isNaN(parsed.getTime())) {
        return 'Not available'
    }

    return parsed.toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
    })
}
