import {
    PROGRAMMING_CATEGORY_ID,
    SkillMemberMock,
    SKILL_CATEGORIES,
} from './skill-categories.mock'

const COUNTRIES: Array<{ code: string; name: string }> = [
    { code: 'IN', name: 'India' },
    { code: 'US', name: 'USA' },
    { code: 'CN', name: 'China' },
    { code: 'GB', name: 'UK' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'CA', name: 'Canada' },
    { code: 'BR', name: 'Brazil' },
    { code: 'DE', name: 'Germany' },
    { code: 'JP', name: 'Japan' },
    { code: 'AU', name: 'Australia' },
]

const HANDLES = [
    'skywalker', 'bytecraft', 'codecat', 'pixelhawk', 'algomind',
    'devnova', 'stackpilot', 'nimbusdev', 'qubitron', 'hashlane',
    'loopsmith', 'gridfox', 'nullwave', 'bitforge', 'cloudnest',
    'syntaxio', 'datapath', 'kernelfox', 'vectorly', 'modulin',
]

const FIRST_NAMES = [
    'Alex', 'Jordan', 'Priya', 'Wei', 'Sofia', 'Noah', 'Amina', 'Lucas', 'Mei', 'Omar',
]

const LAST_NAMES = [
    'Chen', 'Patel', 'Nguyen', 'Garcia', 'Khan', 'Silva', 'Ivanov', 'Kim', 'Brown', 'Rossi',
]

const RATINGS = [780, 950, 1100, 1350, 1480, 1600, 1800, 1900, 2000, 2100, 2200, 2300, 2400]

const PROGRAMMING_TOP_MEMBERS: SkillMemberMock[] = [
    {
        countryCode: 'IN',
        countryName: 'India',
        handle: 'billzedison',
        name: 'Honghan W',
        rating: 2000,
        wins: 376,
    },
    {
        countryCode: 'US',
        countryName: 'USA',
        handle: 'Ghostar',
        name: 'Justin G',
        rating: 1900,
        wins: 322,
    },
    {
        countryCode: 'IN',
        countryName: 'India',
        handle: 'stevenfrog',
        name: 'Steven',
        rating: 2100,
        wins: 280,
    },
    {
        countryCode: 'CN',
        countryName: 'China',
        handle: 'ergolite',
        name: 'Michael P',
        rating: 2200,
        wins: 262,
    },
    {
        countryCode: 'IN',
        countryName: 'India',
        handle: 'jiangliwu',
        name: 'Jiang L',
        rating: 950,
        wins: 210,
    },
    {
        countryCode: 'GB',
        countryName: 'UK',
        handle: 'diazx',
        name: 'DAT N',
        rating: 2300,
        wins: 200,
    },
    {
        countryCode: 'US',
        countryName: 'USA',
        handle: 'Standlove',
        name: 'GuanZhao I',
        rating: 1800,
        wins: 188,
    },
    {
        countryCode: 'IN',
        countryName: 'India',
        handle: 'soso0574',
        name: 'Jianchang S',
        rating: 1600,
        wins: 176,
    },
    {
        countryCode: 'IN',
        countryName: 'India',
        handle: 'vasilica.olaru',
        name: 'vasilica.olaru',
        rating: 2400,
        wins: 132,
    },
    {
        countryCode: 'IN',
        countryName: 'India',
        handle: 'ngoctay',
        name: 'Minh Ngoc P',
        rating: 780,
        wins: 90,
    },
]

function hashString(value: string): number {
    let hash = 0
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash * 31) + value.charCodeAt(index)) % 2147483647
    }

    return Math.abs(hash)
}

function buildGeneratedMembers(categoryId: string, startWins: number): SkillMemberMock[] {
    const members: SkillMemberMock[] = []

    for (let index = 0; index < 90; index += 1) {
        const seed = hashString(`${categoryId}-${index}`)
        const country = COUNTRIES[seed % COUNTRIES.length]
        const firstName = FIRST_NAMES[seed % FIRST_NAMES.length]
        const lastName = LAST_NAMES[hashString(`${categoryId}-last-${index}`) % LAST_NAMES.length]
        const handleBase = HANDLES[hashString(`${categoryId}-handle-${index}`) % HANDLES.length]

        members.push({
            countryCode: country.code,
            countryName: country.name,
            handle: `${handleBase}${index + 1}`,
            name: `${firstName} ${lastName.charAt(0)}`,
            rating: RATINGS[seed % RATINGS.length],
            wins: Math.max(1, startWins - index),
        })
    }

    return members
}

function buildMembersForCategory(categoryId: string): SkillMemberMock[] {
    if (categoryId === PROGRAMMING_CATEGORY_ID) {
        return [
            ...PROGRAMMING_TOP_MEMBERS,
            ...buildGeneratedMembers(categoryId, 89),
        ]
    }

    const seed = hashString(categoryId)
    const startWins = 120 + (seed % 80)

    return buildGeneratedMembers(categoryId, startWins)
        .slice(0, 100)
        .sort((left, right) => right.wins - left.wins)
}

export const SKILL_MEMBERS_BY_CATEGORY: Record<string, SkillMemberMock[]> = Object.fromEntries(
    SKILL_CATEGORIES.map(category => [
        category.id,
        buildMembersForCategory(category.id),
    ]),
)

export function getMembersForCategory(categoryId: string): SkillMemberMock[] {
    return SKILL_MEMBERS_BY_CATEGORY[categoryId] || []
}

export function getTopMemberForCategory(categoryId: string): SkillMemberMock | undefined {
    if (categoryId === PROGRAMMING_CATEGORY_ID) {
        return {
            countryCode: 'IN',
            countryName: 'India',
            handle: 'banerjeesourish',
            name: 'Sourish Banerjee',
            rating: 1400,
            wins: 1768,
        }
    }

    return getMembersForCategory(categoryId)[0]
}
