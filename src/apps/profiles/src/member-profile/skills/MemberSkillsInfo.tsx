/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { filter, orderBy } from 'lodash'

import { getMemberSkillDetails, UserProfile, UserSkill, UserSkillDisplayModes } from '~/libs/core'
import { GroupedSkillsUI, HowSkillsWorkModal, isSkillVerified, SkillPill, useLocalStorage } from '~/libs/shared'
import { Button, IconSolid } from '~/libs/ui'

import { AddButton, EditMemberPropertyBtn, EmptySection } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { MemberProfileContextValue, useMemberProfileContext } from '../MemberProfile.context'

import { ModifySkillsModal } from './ModifySkillsModal'
import { PrincipalSkillsModal } from './PrincipalSkillsModal'
import styles from './MemberSkillsInfo.module.scss'

const COLLAPSED_PRINCIPAL_SKILL_COUNT = 5

interface MemberSkillsInfoProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
    refreshProfile: (handle: string) => void
}

const MemberSkillsInfo: FC<MemberSkillsInfoProps> = (props: MemberSkillsInfoProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)
    const [canFetchSkillDetails, setCanFetchSkillDetails] = useState(true)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle
    const [hasSeenPrincipalIntro, setHasSeenPrincipalIntro] = useLocalStorage('seen-principal-intro', {} as any)

    const { skillsRenderer, isTalentSearch }: MemberProfileContextValue = useMemberProfileContext()

    const memberSkills: UserSkill[] = useMemo(() => orderBy(
        props.profile.skills ?? [],
        [isSkillVerified, 'name'],
        ['desc', 'asc'],
    ) as UserSkill[], [props.profile.skills])

    const principalSkills = useMemo(() => (
        filter(memberSkills, s => s.displayMode?.name === UserSkillDisplayModes.principal)
    ), [memberSkills])

    const additionalSkills = useMemo(() => (
        filter(memberSkills, s => s.displayMode?.name !== UserSkillDisplayModes.principal)
    ), [memberSkills])

    const groupedSkillsByCategory: { [key: string]: UserSkill[] } = useMemo(() => {
        const grouped: { [key: string]: UserSkill[] } = {}
        const sortedGroupedSkillsByCategory: { [key: string]: UserSkill[] } = {}

        additionalSkills.forEach((skill: UserSkill) => {
            const categoryName = skill.category?.name ?? ''
            if (grouped[categoryName]) {
                grouped[categoryName].push(skill)
            } else {
                grouped[categoryName] = [skill]
            }
        })

        Object.keys(grouped)
            .sort()
            .forEach(key => {
                sortedGroupedSkillsByCategory[key] = grouped[key]
            })

        return sortedGroupedSkillsByCategory
    }, [additionalSkills])

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [howSkillsWorkVisible, setHowSkillsWorkVisible]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [principalIntroModalVisible, setPrincipalIntroModalVisible]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [
        isAdditionalSkillsExpanded,
        setIsAdditionalSkillsExpanded,
    ]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const [
        isPrincipalSkillsExpanded,
        setIsPrincipalSkillsExpanded,
    ]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    useEffect(() => {
        setIsAdditionalSkillsExpanded(false)
        setIsPrincipalSkillsExpanded(false)
    }, [props.profile.handle])

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.skills) {
            setIsEditMode(true)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    useEffect(() => {
        if (
            !canEdit
            || !props.authProfile
            || hasSeenPrincipalIntro[props.authProfile.handle]
            || isTalentSearch
        ) {
            return
        }

        setPrincipalIntroModalVisible(true)
    }, [hasSeenPrincipalIntro, canEdit, isTalentSearch, props.authProfile, setHasSeenPrincipalIntro])

    function handleEditSkillsClick(): void {
        setIsEditMode(true)
    }

    function handleModyfSkillsModalClose(): void {
        setIsEditMode(false)
    }

    function handleModyfSkillsSave(): void {
        setTimeout(() => {
            setIsEditMode(false)
            props.refreshProfile(props.profile.handle)
        }, 1500)
    }

    function handleHowSkillsWorkClick(): void {
        setHowSkillsWorkVisible(true)
    }

    function handleHowSkillsWorkClose(): void {
        setHowSkillsWorkVisible(false)
    }

    function handlePrincipalIntroShow(): void {
        setPrincipalIntroModalVisible(true)
    }

    function handlePrincipalIntroClose(): void {
        setHasSeenPrincipalIntro((prevValue: any) => ({
            ...prevValue,
            [props.authProfile?.handle ?? '']: true,
        }))

        setPrincipalIntroModalVisible(false)
    }

    /**
     * Toggles Principal Skills between the five-skill preview and full list.
     *
     * Used by the Principal Skills more/less control on the member profile
     * page. It takes no parameters, returns no value, and does not throw.
     */
    function handlePrincipalSkillsToggle(): void {
        setIsPrincipalSkillsExpanded(isExpanded => !isExpanded)
    }

    /**
     * Toggles visibility for the Additional Skills section from the section arrow.
     *
     * Used by the Additional Skills header button to expand or collapse grouped
     * skills on the member profile page.
     *
     * @returns {void} Updates local component state and returns no value.
     * @throws This handler does not throw errors.
     */
    function handleAdditionalSkillsToggle(): void {
        setIsAdditionalSkillsExpanded(isExpanded => !isExpanded)
    }

    const fetchSkillDetails = useCallback((skillId: string) => getMemberSkillDetails(props.profile.handle, skillId)
        .catch(e => {
            if (e.response.status === 403) {
                setCanFetchSkillDetails(false)
            }

            throw e
        }), [props.profile.handle])

    const visiblePrincipalSkills: UserSkill[] = isPrincipalSkillsExpanded
        ? principalSkills
        : principalSkills.slice(0, COLLAPSED_PRINCIPAL_SKILL_COUNT)
    const hiddenPrincipalSkillCount: number = Math.max(
        principalSkills.length - COLLAPSED_PRINCIPAL_SKILL_COUNT,
        0,
    )

    return (
        <div className={styles.container}>
            <div className={styles.titleWrap}>
                <div className={styles.headerWrap}>
                    <h3>Skills</h3>
                    {
                        canEdit && memberSkills.length > 0 && (
                            <EditMemberPropertyBtn
                                onClick={handleEditSkillsClick}
                            />
                        )
                    }
                </div>
                <div className={styles.skillActions}>
                    <Button
                        link
                        label='How skills work'
                        onClick={handleHowSkillsWorkClick}
                        variant='linkblue'
                    />
                </div>
            </div>

            {
                skillsRenderer && memberSkills.length > 0 && (
                    <div className={styles.skillsWrap}>
                        {skillsRenderer(memberSkills)}
                    </div>
                )
            }

            <div className={styles.skillsWrap}>
                {principalSkills.length > 0 && (
                    <div className={styles.principalSkillsWrap}>
                        <div className='large-subtitle'>
                            Principal Skills
                        </div>
                        <div className={styles.principalSkills}>
                            {visiblePrincipalSkills.map((skill: UserSkill) => (
                                <SkillPill
                                    skill={skill}
                                    key={skill.id}
                                    theme={isSkillVerified(skill) ? 'verified' : 'dark'}
                                    fetchSkillDetails={canFetchSkillDetails ? fetchSkillDetails : undefined}
                                />
                            ))}
                            {hiddenPrincipalSkillCount > 0 && (
                                <button
                                    type='button'
                                    className={styles.principalSkillsToggle}
                                    onClick={handlePrincipalSkillsToggle}
                                >
                                    {isPrincipalSkillsExpanded
                                        ? 'See less'
                                        : `+ ${hiddenPrincipalSkillCount} more skills`}
                                </button>
                            )}
                        </div>
                    </div>
                )}
                {additionalSkills.length > 0 && (
                    <div className={styles.additionalSkillsWrap}>
                        <button
                            type='button'
                            className={styles.additionalSkillsToggle}
                            onClick={handleAdditionalSkillsToggle}
                            aria-expanded={isAdditionalSkillsExpanded}
                            aria-controls='member-profile-additional-skills'
                        >
                            <span className={styles.additionalSkillsTitle}>
                                Additional Skills
                            </span>
                            {isAdditionalSkillsExpanded ? (
                                <IconSolid.ChevronUpIcon
                                    className={styles.additionalSkillsIcon}
                                    aria-hidden='true'
                                />
                            ) : (
                                <IconSolid.ChevronDownIcon
                                    className={styles.additionalSkillsIcon}
                                    aria-hidden='true'
                                />
                            )}
                        </button>
                        <div
                            id='member-profile-additional-skills'
                            className={styles.additionalSkillsContent}
                            hidden={!isAdditionalSkillsExpanded}
                        >
                            <GroupedSkillsUI
                                groupedSkillsByCategory={groupedSkillsByCategory}
                                fetchSkillDetails={canFetchSkillDetails ? fetchSkillDetails : undefined}
                            />
                        </div>
                    </div>
                )}
                {!memberSkills.length && (
                    <EmptySection
                        title='Topcoder verifies and tracks skills as our members complete projects and challenges.'
                        wide
                        selfMessage='Adding at least three skills will increase your visibility with customers.'
                        isSelf={canEdit}
                    >
                        This member has not yet provided skills, but check back soon as their skills will grow as
                        they complete project tasks.
                    </EmptySection>
                )}
            </div>
            {
                canEdit && !memberSkills.length && (
                    <AddButton
                        label='Add skills'
                        onClick={handleEditSkillsClick}
                    />
                )
            }

            {
                isEditMode && (
                    <ModifySkillsModal
                        onClose={handleModyfSkillsModalClose}
                        onSave={handleModyfSkillsSave}
                        showPrincipalIntroModal={handlePrincipalIntroShow}
                    />
                )
            }

            {
                howSkillsWorkVisible && (
                    <HowSkillsWorkModal
                        onClose={handleHowSkillsWorkClose}
                        isTalentSearch={isTalentSearch}
                        iseSelfView={canEdit}
                    />
                )
            }

            {
                principalIntroModalVisible && (
                    <PrincipalSkillsModal
                        onClose={handlePrincipalIntroClose}
                    />
                )
            }
        </div>
    )
}

export default MemberSkillsInfo
