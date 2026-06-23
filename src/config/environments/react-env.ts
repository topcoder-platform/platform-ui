/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/typedef */

export function getReactEnv<T>(varName: string, defaultValue?: string | boolean | number): T {
    const hasDefaultValue: boolean = arguments.length > 1

    const rawValue = process.env[`REACT_APP_${varName}`]

    if (rawValue === undefined && !hasDefaultValue) {
        throw new Error(`${varName} is not defined in process.env!`)
    }

    if (rawValue?.trim() === '' && hasDefaultValue) {
        return defaultValue as T
    }

    let value = rawValue as unknown as T

    // convert to number
    if (rawValue?.trim() !== '' && !Number.isNaN(Number(value))) {
        value = Number(value as unknown) as T
    }

    // convert to null
    if (value === 'null') {
        value = (null as unknown) as T
        // return early as the bottom expresion will just return the "default value"
        return value
    }

    // convert to boolean
    if (value === 'false' || value === 'true') {
        value = (value === 'true' as unknown) as T
    }

    return (value ?? defaultValue) as T
}
