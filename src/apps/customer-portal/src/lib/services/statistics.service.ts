import * as countriesModule from 'i18n-iso-countries'
import enLocaleJson from 'i18n-iso-countries/langs/en.json'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

type LocaleData = { locale: string; countries: Record<string, string> }

const enLocale: LocaleData
    = (enLocaleJson as { default?: LocaleData } | undefined)?.default
    ?? (enLocaleJson as LocaleData)

const countryUtil
    = ((countriesModule as unknown as { default?: typeof countriesModule })
        .default ?? countriesModule) as typeof countriesModule

countryUtil.registerLocale(enLocale)

export function toAlpha2CountryCode(code: string): string {
    const normalized = String(code || '')
        .trim()
        .toUpperCase()

    return normalized.length === 3
        ? countryUtil.alpha3ToAlpha2(normalized) ?? normalized
        : normalized
}

export type StatisticsWinner = {
    handle: string
    maxRating?: number
    photoURL?: string
    wins: number
}

export type StatisticsSkill = {
    count: number
    name: string
    percentage: number
}

export type StatisticsCountry = {
    code?: string
    count: number
    flagUrl?: string
    name: string
    skillsBreakdown?: StatisticsSkill[]
    topMembers?: StatisticsWinner[]
    topWinners?: StatisticsWinner[]
    totalSkills?: number
}

export type GeneralStatistics = {
    completedChallenges: number
    countries: StatisticsCountry[]
    memberCount: number
    totalPrizes: number
}

type CountryReportRow = {
    'challenge_stats.count'?: number | string
    'country.country_name'?: string
    topWinners?: Array<{
        handle?: string
        maxRating?: number | string | null
        photoURL?: string | null
        wins?: number | string
    }>
    topMembers?: Array<{
        handle?: string
        maxRating?: number | string | null
        photoURL?: string | null
        wins?: number | string
    }>
    skillsBreakdown?: Array<{
        count?: number | string
        name?: string
        percentage?: number | string
    }>
    totalSkills?: number | string
    'user.count'?: number | string
}

type CountryLookupRow = {
    countryCode?: string
    countryFlag?: string
    name?: string
}

type CountryLookupResponse = {
    result?: CountryLookupRow[]
}

const GENERAL_STATISTICS_URL = `${EnvironmentConfig.REPORTS_API}/statistics/general`
const COUNTRY_LOOKUP_URL = `${EnvironmentConfig.API.V6}/lookups/countries?page=1&perPage=9999`

const COUNTRY_NAME_ALIASES: Record<string, string> = {
    'bosnia and herzegovina': 'bosnia and herzegowina',
    'czech republic': 'czechia',
    'iran islamic republic of': 'iran',
    'korea democratic peoples republic of': 'north korea',
    'korea republic of': 'south korea',
    'lao peoples democratic republic': 'laos',
    // 'macedonia the former yugoslav republic of': 'north macedonia',
    'macedonia the former yugoslav republic of': 'macedonia former yugoslav rep of',
    'moldova republic of': 'moldova',
    'russian federation': 'russia',
    'syrian arab republic': 'syria',
    'taiwan province of china': 'taiwan',
    'tanzania united republic of': 'tanzania',
    'united states': 'united states of america',
    'venezuela bolivarian republic of': 'venezuela',
    'viet nam': 'vietnam',
}

function normalizeCountryName(name: string): string {
    const normalized = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .toLowerCase()

    return COUNTRY_NAME_ALIASES[normalized] || normalized
}

function unwrapCountryLookups(response: CountryLookupResponse | CountryLookupRow[]): CountryLookupRow[] {
    if (Array.isArray(response)) {
        return response
    }

    return Array.isArray(response?.result) ? response.result : []
}

function normalizeCountryRows(
    rows: CountryReportRow[],
    countKey: 'challenge_stats.count' | 'user.count',
    lookups: CountryLookupRow[],
): StatisticsCountry[] {
    const lookupsByName = new Map<string, CountryLookupRow>()
    lookups.forEach(lookup => {
        if (lookup.name) {
            lookupsByName.set(normalizeCountryName(lookup.name), lookup)
        }
    })

    const countries = new Map<string, StatisticsCountry>()
    rows.forEach(row => {
        const name = String(row['country.country_name'] || '')
            .trim()
        const count = Number(row[countKey] || 0)
        const normalizedName = normalizeCountryName(name)
        const lookup = lookupsByName.get(normalizedName)

        // Ignore malformed report rows and values that cannot be mapped to a real country.
        if (!name || !Number.isFinite(count) || count <= 0 || !lookup?.countryCode) {
            return
        }

        const code = toAlpha2CountryCode(lookup.countryCode)
        const current = countries.get(code)
        const topWinners = (row.topWinners || [])
            .map(winner => ({
                handle: String(winner.handle || '')
                    .trim(),
                maxRating: winner.maxRating === null || winner.maxRating === undefined
                    ? undefined
                    : Number(winner.maxRating),
                photoURL: String(winner.photoURL || '')
                    .trim() || undefined,
                wins: Number(winner.wins || 0),
            }))
            .filter(winner => (
                winner.handle
                && Number.isFinite(winner.wins)
                && winner.wins > 0
            ))
            .slice(0, 3)
        const topMembers = (row.topMembers || [])
            .map(member => ({
                handle: String(member.handle || '')
                    .trim(),
                maxRating: member.maxRating === null || member.maxRating === undefined
                    ? undefined
                    : Number(member.maxRating),
                photoURL: String(member.photoURL || '')
                    .trim() || undefined,
                wins: Number(member.wins || 0),
            }))
            .filter(member => (
                member.handle
                && Number.isFinite(member.wins)
                && member.wins > 0
            ))
            .slice(0, 3)
        const skillsBreakdown = (row.skillsBreakdown || [])
            .map(skill => ({
                count: Number(skill.count || 0),
                name: String(skill.name || '')
                    .trim(),
                percentage: Number(skill.percentage || 0),
            }))
            .filter(skill => (
                skill.name
                && Number.isFinite(skill.count)
                && skill.count > 0
                && Number.isFinite(skill.percentage)
            ))
            .slice(0, 3)
        countries.set(code, {
            code,
            count: (current?.count || 0) + count,
            // flagUrl: lookup.countryFlag?.replace(/^http:/, 'https:'),
            name: lookup.name || name,
            skillsBreakdown: skillsBreakdown.length > 0
                ? skillsBreakdown
                : current?.skillsBreakdown,
            topMembers: topMembers.length > 0 ? topMembers : current?.topMembers,
            topWinners: topWinners.length > 0 ? topWinners : current?.topWinners,
            totalSkills: Number(row.totalSkills || 0),
        })
    })

    return Array.from(countries.values())
        .sort((countryA, countryB) => countryB.count - countryA.count)
}

export async function fetchCountriesRepresented(): Promise<StatisticsCountry[]> {
    const [rows, lookupResponse] = await Promise.all([
        xhrGetAsync<CountryReportRow[]>(`${GENERAL_STATISTICS_URL}/country-member-details`),
        xhrGetAsync<CountryLookupResponse | CountryLookupRow[]>(COUNTRY_LOOKUP_URL),
    ])

    return normalizeCountryRows(rows, 'user.count', unwrapCountryLookups(lookupResponse))
}

export async function fetchWinnersByCountry(): Promise<StatisticsCountry[]> {
    const [rows, lookupResponse] = await Promise.all([
        xhrGetAsync<CountryReportRow[]>(`${GENERAL_STATISTICS_URL}/top-winners-by-country`),
        xhrGetAsync<CountryLookupResponse | CountryLookupRow[]>(COUNTRY_LOOKUP_URL),
    ])

    return normalizeCountryRows(rows, 'challenge_stats.count', unwrapCountryLookups(lookupResponse))
}

export async function fetchGeneralStatistics(): Promise<GeneralStatistics> {
    const [
        memberCountResponse,
        totalPrizesResponse,
        completedChallengesResponse,
        countries,
    ] = await Promise.all([
        xhrGetAsync<{ 'user.count'?: number }>(`${GENERAL_STATISTICS_URL}/member-count`),
        xhrGetAsync<{ total?: number | string }>(`${GENERAL_STATISTICS_URL}/total-prizes`),
        xhrGetAsync<{ 'challenge.count'?: number }>(`${GENERAL_STATISTICS_URL}/completed-challenges`),
        fetchCountriesRepresented(),
    ])

    return {
        completedChallenges: Number(completedChallengesResponse['challenge.count'] || 0),
        countries,
        memberCount: Number(memberCountResponse['user.count'] || 0),
        totalPrizes: Number(totalPrizesResponse.total || 0),
    }
}
