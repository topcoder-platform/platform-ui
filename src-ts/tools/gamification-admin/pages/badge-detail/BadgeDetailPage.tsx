import { noop, trim } from 'lodash'
import MarkdownIt from 'markdown-it'
import { createRef, Dispatch, FC, KeyboardEvent, RefObject, SetStateAction, useEffect, useState } from 'react'
import ContentEditable from 'react-contenteditable'
import { Params, useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Breadcrumb, BreadcrumbItemModel, Button, ButtonProps, ContentLayout, IconOutline, LoadingSpinner, PageDivider, TabsNavbar, TabsNavItem } from '../../../../lib'
import { GamificationConfig } from '../../game-config'
import { BadgeDetailPageHandler, GameBadge, useGamificationBreadcrumb, useGetGameBadgeDetails } from '../../game-lib'

import AwardedMembersTab from './AwardedMembersTab/AwardedMembersTab'
import { badgeDetailsTabs, BadgeDetailsTabViews } from './badge-details-tabs.config'
import { submitRequestAsync as updateBadgeAsync } from './badge-details.functions'
import styles from './BadgeDetailPage.module.scss'
import BatchAwardTab from './BatchAwardTab/BatchAwardTab'
import ManualAwardTab from './ManualAwardTab/ManualAwardTab'

const md: MarkdownIt = new MarkdownIt({
    html: true,
    // TODO: check with PM ig those are needed?
    // linkify: true,
    // typographer: true,
})

/* tslint:disable:cyclomatic-complexity */
const BadgeDetailPage: FC = () => {
    const [headerButtonConfig, setHeaderButtonConfig]: [
        ButtonProps | undefined,
        Dispatch<SetStateAction<ButtonProps | undefined>>,
    ]
        = useState<ButtonProps | undefined>()

    const breadcrumb: Array<BreadcrumbItemModel> = useGamificationBreadcrumb([
        {
            name: 'badge detail',
            url: '#',
        },
    ])

    const { id: badgeID }: Readonly<Params<string>> = useParams()

    const { hash }: { hash: string } = useLocation()

    const [activeTab, setActiveTab]: [string, Dispatch<SetStateAction<string>>] = useState<string>(
        hash === '#award' ? BadgeDetailsTabViews.manualAward : BadgeDetailsTabViews.awardedMembers
    )

    const [tabs]: [
        ReadonlyArray<TabsNavItem>,
        Dispatch<SetStateAction<ReadonlyArray<TabsNavItem>>>,
    ]
        = useState<ReadonlyArray<TabsNavItem>>([...badgeDetailsTabs])

    const badgeDetailsHandler: BadgeDetailPageHandler<GameBadge> = useGetGameBadgeDetails(badgeID as string)

    const badgeNameRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>()

    const badgeDescRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>()

    const fileInputRef: RefObject<HTMLInputElement> = createRef<HTMLInputElement>()

    // tslint:disable-next-line:no-null-keyword
    const [newImageFile, setNewImageFile]: [FileList | null, Dispatch<SetStateAction<FileList | null>>] = useState<FileList | null>(null)

    const [fileDataURL, setFileDataURL]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState<string | undefined>()

    const [isBadgeDescEditingMode, setIsBadgeDescEditingMode]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    useEffect(() => {
        if (newImageFile && newImageFile.length) {
            const fileReader: FileReader = new FileReader()
            fileReader.onload = e => {
                const { result }: any = e.target
                if (result) {
                    setFileDataURL(result)
                }
            }
            fileReader.readAsDataURL(newImageFile[0])
        } else if (fileDataURL) {
            setFileDataURL(undefined)
        }
    }, [
        newImageFile,
        fileDataURL,
    ])

    useEffect(() => {
        if (newImageFile && newImageFile.length) {
            updateBadgeAsync({
                files: newImageFile as FileList,
                id: badgeDetailsHandler.data?.id as string,
            })
                .then((updatedBadge: GameBadge) => {
                    toast.success('Badge image file saved.')
                    badgeDetailsHandler.mutate({
                        ...badgeDetailsHandler.data,
                        badge_image_url: updatedBadge.badge_image_url,
                    })
                })
        }
    }, [
        newImageFile,
    ])

    useEffect(() => {
        if (badgeDetailsHandler.data) {
            switch (badgeDetailsHandler.data?.active) {
                case true:
                    setHeaderButtonConfig({
                        label: 'DeActivate',
                        onClick: onDisableBadge,
                    })
                    break
                case false:
                    setHeaderButtonConfig({
                        label: 'Activate',
                        onClick: onActivateBadge,
                    })
                    break
            }
        }
    }, [
        badgeDetailsHandler.data,
    ])

    // define the tabs so they can be displayed on various tasks
    const tabsElement: JSX.Element = (
        <TabsNavbar
            tabs={tabs}
            defaultActive={activeTab}
            onChange={setActiveTab}
        />
    )

    function onActivateBadge(): void {
        // TODO: implement in GAME-127
    }

    function onDisableBadge(): void {
        // TODO: implement in GAME-127
    }

    function onNameEditKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Enter') {
            e.preventDefault()
            badgeNameRef.current?.blur()
        }
    }

    function onBadgeNameEditFocus(): void {
        if (isBadgeDescEditingMode) {
            setIsBadgeDescEditingMode(false)
        }
    }

    function onSaveBadgeName(): any {
        const newBadgeName: string | undefined = trim(badgeNameRef.current?.innerHTML)
        if (newBadgeName !== badgeDetailsHandler.data?.badge_name) {
            // save only if different
            updateBadgeAsync({
                badgeName: newBadgeName,
                id: badgeDetailsHandler.data?.id as string,
            })
                .then(() => {
                    toast.success('Badge name update saved.')
                    badgeDetailsHandler.mutate({
                        ...badgeDetailsHandler.data,
                        badge_name: newBadgeName,
                    })
                })
        }
    }

    function onSaveBadgeDesc(): any {
        setIsBadgeDescEditingMode(false)
        const newBadgeDesc: string | undefined = trim(badgeDescRef.current?.innerHTML)
        if (newBadgeDesc !== badgeDetailsHandler.data?.badge_description) {
            // save only if different
            updateBadgeAsync({
                badgeDesc: newBadgeDesc,
                id: badgeDetailsHandler.data?.id as string,
            })
                .then(() => {
                    toast.success('Badge description update saved.')
                    badgeDetailsHandler.mutate({
                        ...badgeDetailsHandler.data,
                        badge_description: newBadgeDesc,
                    })
                })
        }
    }

    // default tab
    let activeTabElement: JSX.Element
        = <AwardedMembersTab
            awardedMembers={badgeDetailsHandler.data?.member_badges}
        />
    if (activeTab === BadgeDetailsTabViews.manualAward) {
        activeTabElement = <ManualAwardTab awardedMembers={badgeDetailsHandler.data?.member_badges} />
    }
    if (activeTab === BadgeDetailsTabViews.batchAward) {
        activeTabElement = <BatchAwardTab />
    }

    // show page loader if we fetching results
    if (!badgeDetailsHandler.data && !badgeDetailsHandler.error) {
        return <LoadingSpinner />
    }

    return (
        <ContentLayout
            title='Badge Detail'
            buttonConfig={headerButtonConfig}
        >
            <Breadcrumb items={breadcrumb} />
            <div className={styles.container}>
                {
                    badgeDetailsHandler.error ? (
                        <div className={styles.error}>
                            {badgeDetailsHandler.error.message}
                        </div>
                    ) : (
                        <>
                            <div className={styles.badge}>
                                <div className={styles.badgeImage}>
                                    <Button
                                        buttonStyle='icon'
                                        icon={IconOutline.PencilIcon}
                                        className={styles.filePickerPencil}
                                        onClick={() => fileInputRef.current?.click()} />
                                    <img src={fileDataURL || badgeDetailsHandler.data?.badge_image_url} alt='badge media preview' />
                                    <input
                                        type={'file'}
                                        ref={fileInputRef}
                                        className={styles.filePickerInput}
                                        accept={GamificationConfig.ACCEPTED_BADGE_MIME_TYPES}
                                        size={GamificationConfig.MAX_BADGE_IMAGE_FILE_SIZE}
                                        onChange={e => setNewImageFile(e.target.files)}
                                    />
                                </div>
                                <div className={styles.badgeDetails}>
                                    <ContentEditable
                                        innerRef={badgeNameRef}
                                        html={badgeDetailsHandler.data?.badge_name as string}
                                        onChange={noop}
                                        onKeyDown={onNameEditKeyDown}
                                        onBlur={onSaveBadgeName}
                                        onFocus={onBadgeNameEditFocus}
                                        className={styles.badgeName}
                                    />
                                    <div className={styles.badgeDesc}>
                                        <div className={styles.badgeEditWrap}>
                                            <ContentEditable
                                                innerRef={badgeDescRef}
                                                html={
                                                    isBadgeDescEditingMode
                                                        ? badgeDetailsHandler.data?.badge_description as string
                                                        : md.render(badgeDetailsHandler.data?.badge_description as string)
                                                }
                                                onChange={noop}
                                                onFocus={() => setIsBadgeDescEditingMode(true)}
                                                className={isBadgeDescEditingMode ? styles.badgeEditableMode : styles.badgeEditable}
                                            />
                                            {
                                                isBadgeDescEditingMode && <div className={styles.badgeEditActions}>
                                                    <Button
                                                        label='Cancel'
                                                        buttonStyle='secondary'
                                                        size='xs'
                                                        onClick={() => setIsBadgeDescEditingMode(false)}
                                                    />
                                                    <Button
                                                        label='Save'
                                                        size='xs'
                                                        onClick={onSaveBadgeDesc}
                                                    />
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <PageDivider />
                            {tabsElement}
                            <div className={styles.activeTabElement}>
                                {activeTabElement}
                            </div>
                        </>
                    )
                }
            </div>
        </ContentLayout>
    )
}

export default BadgeDetailPage
