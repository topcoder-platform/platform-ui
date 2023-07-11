/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/typedef */

export function getReactEnv<T>(varName: string, defaultValue?: string | boolean | number): T {
    const hasDefaultValue: boolean = arguments.length > 1
    let value = process.env[`REACT_APP_${varName}`] as unknown as T

    if (value === undefined && !hasDefaultValue) {
        throw new Error(`${varName} is not defined in process.env!`)
    }

    // convert to boolean
    if (value === 'false' || value === 'true') {
        value = (value === 'true' as unknown) as T
    }

    // convert to null
    if (value === 'null') {
        value = (null as unknown) as T
    }

    // convert to number
    if (!Number.isNaN(Number(value))) {
        value = (null as unknown) as T
    }

    return (value ?? defaultValue) as T
}
