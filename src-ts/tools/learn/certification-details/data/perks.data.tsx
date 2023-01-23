export type PerkIconsType = |
    'currency-dolary' |
    'icon-certif' |
    'shield-check' |
    'filter-icon';

export interface PerkItem {
    description: string
    icon: PerkIconsType
    title: string
}

export const perks: Array<PerkItem> = [
    {
        description: `
            Your certification will appear on your Topcoder profile,
            increasing your chances of employers engaging with you.
        `,
        icon: 'currency-dolary',
        title: 'Increase my chances to earn',
    },
    {
        description: `
            You will receive a digital certificate that can be linked to
            your resume/CV, as verified proof of your skills.
        `,
        icon: 'icon-certif',
        title: 'Proof of my skills',
    },
    {
        description: `
            Topcoder has been grooming top developers for over 20 years.
        `,
        icon: 'shield-check',
        title: 'Trusted Platform',
    },
    {
        description: `
            Topcoder is continuously looking for the best content to fill
            our certifications.
        `,
        icon: 'filter-icon',
        title: 'Curated learning',
    },
]
