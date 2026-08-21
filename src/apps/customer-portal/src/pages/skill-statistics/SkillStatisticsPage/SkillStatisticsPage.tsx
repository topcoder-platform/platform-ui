import { FC, useCallback, useMemo, useState } from 'react'
import 'flag-icons/css/flag-icons.min.css'

import { getMembersForCategory, SKILL_CATEGORIES } from './mock'
import SkillBubblesChart from './SkillBubblesChart'
import SkillMembersPanel from './SkillMembersPanel'
import styles from './SkillStatisticsPage.module.scss'

const SkillStatisticsPage: FC = () => {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>()
    const [search, setSearch] = useState('')
    const [countryFilter, setCountryFilter] = useState('')

    const selectedCategory = useMemo(
        () => SKILL_CATEGORIES.find(category => category.id === selectedCategoryId),
        [selectedCategoryId],
    )
    const selectedMembers = useMemo(
        () => (selectedCategoryId ? getMembersForCategory(selectedCategoryId) : []),
        [selectedCategoryId],
    )

    const selectCategory = useCallback((categoryId: string) => {
        setSelectedCategoryId(categoryId)
        setSearch('')
        setCountryFilter('')
    }, [])

    return (
        <main className={styles.page}>
            <section className={styles.header}>
                <h1>Skill Statistics</h1>
                <p className={styles.subtitle}>
                    Browse and connect with verified experts across 23 skill categories.
                </p>
            </section>

            <div className={styles.chartPanel}>
                <p className={styles.hint}>Select a skill category to see additional details</p>
                <SkillBubblesChart
                    categories={SKILL_CATEGORIES}
                    onSelect={selectCategory}
                    selectedCategoryId={selectedCategoryId}
                />
            </div>

            {selectedCategory && (
                <SkillMembersPanel
                    category={selectedCategory}
                    countryFilter={countryFilter}
                    members={selectedMembers}
                    onCountryChange={setCountryFilter}
                    onSearchChange={setSearch}
                    search={search}
                />
            )}
        </main>
    )
}

export default SkillStatisticsPage
