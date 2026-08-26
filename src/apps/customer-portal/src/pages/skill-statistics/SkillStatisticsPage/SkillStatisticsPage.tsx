import { FC, useCallback, useMemo, useState } from 'react'
import useSWR, { SWRResponse } from 'swr'
import 'flag-icons/css/flag-icons.min.css'

import {
    ExpertSkillCategory,
    ExpertSkillCategoryMember,
    expertSkillCategoryMembersCacheKey,
    EXPERT_SKILL_CATEGORIES_CACHE_KEY,
    fetchExpertSkillCategories,
    fetchExpertSkillCategoryMembers,
} from '../../../lib'

import SkillBubblesChart from './SkillBubblesChart'
import SkillMembersPanel from './SkillMembersPanel'
import styles from './SkillStatisticsPage.module.scss'

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')

function getPageSubtitle(categoryCount?: number): string {
    if (!categoryCount) {
        return 'Browse and connect with verified experts.'
    }

    return `Browse and connect with verified experts across ${NUMBER_FORMATTER.format(categoryCount)} skill categories.`
}

const SkillStatisticsPage: FC = () => {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>()
    const [search, setSearch] = useState('')
    const [countryFilter, setCountryFilter] = useState('')
    const {
        data: categories,
        error: categoriesError,
        mutate: reloadCategories,
    }: SWRResponse<ExpertSkillCategory[], Error> = useSWR(
        EXPERT_SKILL_CATEGORIES_CACHE_KEY,
        fetchExpertSkillCategories,
    )

    const selectedCategory = useMemo(
        () => categories?.find(category => category.id === selectedCategoryId),
        [categories, selectedCategoryId],
    )
    const {
        data: members,
        error: membersError,
        mutate: reloadMembers,
    }: SWRResponse<ExpertSkillCategoryMember[], Error> = useSWR(
        selectedCategory
            ? expertSkillCategoryMembersCacheKey(selectedCategory.name)
            : undefined,
        () => fetchExpertSkillCategoryMembers(selectedCategory?.name || ''),
    )

    const isLoadingCategories = !categories && !categoriesError
    const isLoadingMembers = Boolean(selectedCategory && !members && !membersError)

    const selectCategory = useCallback((categoryId: string) => {
        setSelectedCategoryId(categoryId)
        setSearch('')
        setCountryFilter('')
    }, [])

    const retryCategories = useCallback(() => {
        reloadCategories()
    }, [reloadCategories])

    const retryMembers = useCallback(() => {
        reloadMembers()
    }, [reloadMembers])

    return (
        <main className={styles.page}>
            <section className={styles.header}>
                <h1>Skill Statistics</h1>
                <p className={styles.subtitle}>{getPageSubtitle(categories?.length)}</p>
            </section>

            <div className={styles.chartPanel}>
                <p className={styles.hint}>Select a skill category to see additional details</p>
                {isLoadingCategories && (
                    <div className={styles.status}>Loading skill categories…</div>
                )}
                {categoriesError && (
                    <div className={styles.status} role='alert'>
                        Skill categories could not be loaded.
                        <button type='button' onClick={retryCategories}>
                            Try again
                        </button>
                    </div>
                )}
                {!isLoadingCategories && !categoriesError && (
                    <SkillBubblesChart
                        categories={categories || []}
                        onSelect={selectCategory}
                        selectedCategoryId={selectedCategoryId}
                    />
                )}
            </div>

            {selectedCategory && isLoadingMembers && (
                <div className={styles.status}>Loading members…</div>
            )}
            {selectedCategory && membersError && (
                <div className={styles.status} role='alert'>
                    Members could not be loaded.
                    <button type='button' onClick={retryMembers}>
                        Try again
                    </button>
                </div>
            )}
            {selectedCategory && !isLoadingMembers && !membersError && (
                <SkillMembersPanel
                    category={selectedCategory}
                    countryFilter={countryFilter}
                    members={members || []}
                    onCountryChange={setCountryFilter}
                    onSearchChange={setSearch}
                    search={search}
                />
            )}
        </main>
    )
}

export default SkillStatisticsPage
