import { readFileSync } from 'fs'

const memberTCAchievementsStyles = readFileSync(`${__dirname}/MemberTCAchievements.module.scss`, 'utf8')

describe('MemberTCAchievements styles', () => {
    it('keeps the desktop card padding even at the top and bottom', () => {
        expect(memberTCAchievementsStyles)
            .toMatch(/\.container \{[\s\S]*?padding: \$sp-8;/)
    })
})
