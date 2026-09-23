/**
 * SMU options displayed in project and showcase forms.
 */
export const SMU_VALUES = ['AMPE', 'EURP', 'AMR1', 'AM2', 'Others']

/**
 * SMU labels used before the Salesforce naming alignment, mapped to their
 * current option so existing projects keep rendering a valid selection.
 */
export const LEGACY_SMU_VALUES: Readonly<{ [legacyValue: string]: string }> = {
    Americas1: 'AMR1',
    Americas2: 'AM2',
    AMR2: 'AM2',
    APME: 'AMPE',
    APMEA: 'AMPE',
    Europe: 'EURP',
}

/**
 * Maps a stored SMU label onto a currently supported option.
 * @param value SMU value loaded from a project or showcase post.
 * @returns The supported option, or the original value when it is not a legacy label.
 * @throws Does not throw.
 */
export function normalizeSmuValue(value: string | undefined): string {
    if (!value) {
        return ''
    }

    return LEGACY_SMU_VALUES[value] ?? value
}

export const SHOWCASE_TYPE_VALUES = [
    'Open Innovation',
    'Private POD Delivery',
    'Flexi-Talent Supply',
    'AI Data Licensing',
]

export const SHOWCASE_CURRENT_STATUS_VALUES = ['Delivered', 'In Delivery', 'On-Hold', 'Planned']
