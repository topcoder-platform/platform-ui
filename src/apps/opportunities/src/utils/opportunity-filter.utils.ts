/**
 * Converts the editable comma-separated technology control into deduplicated
 * owning-API facet values.
 *
 * @param value raw controlled input text.
 * @returns trimmed, non-empty skill and technology values.
 * @throws Does not throw.
 */
export function parseSkillsFilter(value: string): string[] {
    return Array.from(new Set(
        value.split(',')
            .map(skill => skill.trim())
            .filter(Boolean),
    ))
}
