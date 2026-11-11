/** Mirrors the API's verification requirement for browser sessions; APIs verify signatures. */
export function hasVerifiedEmail(payload: Record<string, unknown> | null | undefined): boolean {
    if (!payload || typeof payload !== 'object') return false

    const namespaces = [
        '', 'https://topcoder.com/', 'https://www.topcoder.com/', 'https://topcoder-dev.com/',
        'https://api.topcoder.com/v6/', 'https://api.topcoder-dev.com/v6/', 'http://www.topcoder.com/',
        'https://api.topcoder.com/', 'https://api.topcoder-dev.com/',
    ]
    const values = ['email_verified', 'emailVerified', 'emailActive']
        .flatMap(name => namespaces
            .filter(prefix => Object.prototype.hasOwnProperty.call(payload, `${prefix}${name}`))
            .map(prefix => payload[`${prefix}${name}`]))

    return values.length > 0 && values.every(value => value === true)
}
