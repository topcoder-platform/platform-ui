/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { readFileSync } from 'fs'

const defaultAchievementsViewStyles = readFileSync(`${__dirname}/DefaultAchievementsView.module.scss`, 'utf8')

describe('DefaultAchievementsView styles', () => {
    it('shares columns between special roles and the TCO / member stats cards', () => {
        expect(defaultAchievementsViewStyles)
            .toMatch(/\.achievementsGrid \{[\s\S]*?display: grid;/)
        expect(defaultAchievementsViewStyles)
            .toMatch(/&.twoColumns \{[\s\S]*?grid-template-columns: 1fr 1fr;/)
        expect(defaultAchievementsViewStyles)
            .toMatch(/&.twoColumns \{[\s\S]*?column-gap: \$sp-8;/)
        expect(defaultAchievementsViewStyles)
            .toMatch(/\.col1 \{[\s\S]*?grid-column: 1;/)
        expect(defaultAchievementsViewStyles)
            .toMatch(/\.twoColumns & \{[\s\S]*?grid-column: 2;/)
        expect(defaultAchievementsViewStyles)
            .toMatch(/\.spanAll \{[\s\S]*?grid-column: 1 \/ -1;/)
    })
})
