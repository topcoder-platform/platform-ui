import countries from './countries.json'

export const COUNTRIES_OPTIONS: any = countries.map((ct) => ({
    label: ct.name,
    value: ct.code,
}))
