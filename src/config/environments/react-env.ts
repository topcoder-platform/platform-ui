/* eslint-disable @typescript-eslint/typedef */

export function getReactEnv<T>(varName: string, defaultValue?: string | boolean | number): T {
    const hasDefaultValue: boolean = arguments.length > 1
    const value = process.env[`REACT_APP_${varName}`]

    if (value === undefined && !hasDefaultValue) {
        throw new Error(`${varName} is not defined in process.env!`)
    }

    return (value ?? defaultValue) as T
}
