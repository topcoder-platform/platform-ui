/* eslint-disable import/no-unresolved */
import { noop, trim } from 'lodash'
import {
    ChangeEvent,
    createRef,
    Dispatch,
    FC,
    KeyboardEvent,
    RefObject,
    SetStateAction,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Params, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { KeyedMutator, useSWRConfig } from 'swr'
import { FullConfiguration } from 'swr/dist/types'
import ContentEditable from 'react-contenteditable'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

import {
    Button,
    ButtonProps,
    ContentLayout,
    IconOutline,
    IconSolid,
    LoadingSpinner,
    PageDivider,
    tableGetDefaultSort,
    TabsNavbar,
    TabsNavItem,
} from '~/libs/ui'

import { ACCEPTED_BADGE_MIME_TYPES, MAX_BADGE_IMAGE_FILE_SIZE } from '../../config'
import {
    BadgeDetailPageHandler,
    GameBadge,
    Sort,
    useGetGameBadgeDetails,
    useGetGameBadgesPage,
} from '../../game-lib'
import { BadgeActivatedModal } from '../../game-lib/modals/badge-activated-modal'
import { badgeListingColumns } from '../badge-listing/badge-listing-table'

import { badgeDetailsTabs, BadgeDetailsTabViews } from './badge-details-tabs.config'
import { submitRequestAsync as updateBadgeAsync } from './badge-details.functions'
import AwardedMembersTab from './AwardedMembersTab/AwardedMembersTab'
import BatchAwardTab from './BatchAwardTab/BatchAwardTab'
import ManualAwardTab from './ManualAwardTab/ManualAwardTab'
import styles from './BadgeDetailPage.module.scss'

const md: MarkdownIt = new MarkdownIt({
    html: true,
    // TODO: check with PM ig those are needed?
    // linkify: true,
    // typographer: true,
})

interface Props extends GameBadge {
    rootPage: string;
}
const BadgeDetailPage: FC<Props> = (props: Props) => {
    const initColumns = useMemo(() => badgeListingColumns(props.rootPage), [props.rootPage])
    const navigate = useNavigate()
    const [headerButtonConfig, setHeaderButtonConfig]: [
        ButtonProps | undefined,
        Dispatch<SetStateAction<ButtonProps | undefined>>,
    ]
        = useState<ButtonProps | undefined>()

    const { id: badgeID }: Readonly<Params<string>> = useParams()

    const { hash }: { hash: string } = useLocation()

    const [activeTab, setActiveTab]: [string, Dispatch<SetStateAction<string>>] = useState<string>(
        hash === '#award' ? BadgeDetailsTabViews.manualAward : BadgeDetailsTabViews.awardedMembers,
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

    const [newImageFile, setNewImageFile]: [FileList | undefined, Dispatch<SetStateAction<FileList | undefined>>]
        = useState<FileList | undefined>(undefined)

    const [fileDataURL, setFileDataURL]: [string | undefined, Dispatch<SetStateAction<string | undefined>>]
        = useState<string | undefined>()

    const [isBadgeDescEditingMode, setIsBadgeDescEditingMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    // badgeListingMutate will reset badge listing page cache when called
    const sort: Sort = tableGetDefaultSort(initColumns)
    const { mutate: badgeListingMutate }: { mutate: KeyedMutator<any> } = useGetGameBadgesPage(sort)

    const [badgeNameErrorText, setBadgeNameErrorText]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ] = useState<string | undefined>()

    const [showActivatedModal, setShowActivatedModal]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const { cache, mutate }: FullConfiguration = useSWRConfig()

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
                    onBadgeUpdated()
                })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                default: break
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        updateBadgeAsync({
            badgeActive: true,
            id: badgeDetailsHandler.data?.id as string,
        })
            .then(() => {
                badgeDetailsHandler.mutate({
                    ...badgeDetailsHandler.data,
                    active: true,
                })
                setShowActivatedModal(true)
                onBadgeUpdated()
            })
            // eslint-disable-next-line no-alert
            .catch(e => alert(`onActivateBadge error: ${e.message}`))
    }

    function onDisableBadge(): void {
        updateBadgeAsync({
            badgeActive: false,
            id: badgeDetailsHandler.data?.id as string,
        })
            .then(() => {
                badgeDetailsHandler.mutate({
                    ...badgeDetailsHandler.data,
                    active: false,
                })
                setShowActivatedModal(true)
                onBadgeUpdated()
            })
            // eslint-disable-next-line no-alert
            .catch(e => alert(`onDisableBadge error: ${e.message}`))
    }

    function onNameEditKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Enter') {
            e.preventDefault()
            badgeNameRef.current?.blur()
        } else if (/[`'<>]+/.test(e.key)) {
            // restrict those characters
            e.preventDefault()
        }
    }

    function onBadgeNameEditFocus(): void {
        if (isBadgeDescEditingMode) {
            setIsBadgeDescEditingMode(false)
        }
    }

    function sanitazeBadgeName(innerHTML: string): string {
        const clean: string = sanitizeHtml(innerHTML, {
            allowedTags: [],
        })
        return trim(clean)
    }

    function onSaveBadgeName(): any {
        const newBadgeName: string = sanitazeBadgeName(badgeNameRef.current?.innerHTML as string)
        if (!newBadgeName) {
            setBadgeNameErrorText('Update rejected due to invalid title string.')
            return
        }

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
                    onBadgeUpdated()
                })
                .catch(e => {
                    setBadgeNameErrorText(e.message)
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
                    onBadgeUpdated()
                })
        }
    }

    function onBadgeUpdated(): void {
        badgeListingMutate()
    }

    function handleBadgeEditClick(): void {
        fileInputRef.current?.click()
    }

    function cancelEditBadge(): void {
        setIsBadgeDescEditingMode(false)
    }

    function hideActivateModal(): void {
        setShowActivatedModal(false)
    }

    function handleContentEditFocus(): void {
        setIsBadgeDescEditingMode(true)
    }

    function handleContentChange(): void {
        if (badgeNameErrorText) {
            setBadgeNameErrorText(undefined)
        }
    }

    function validateFilePicked(e: ChangeEvent<HTMLInputElement>): void {
        if (e.target.files?.length) {
            if (ACCEPTED_BADGE_MIME_TYPES.includes(e.target.files[0].type)) {
                setNewImageFile(e.target.files)
            } else {
                toast.error(`Not allowed file type: ${e.target.files[0].type}`)
            }
        }
    }

    function onAssign(): void {
        // refresh awardedMembers data
        // for all keys in the cache, containing `assignees`
        (cache as Map<string, any>).forEach((v, key) => {
            if (key.startsWith('https') && key.includes('assignees')) {
                mutate(key, undefined)
            }
        })
        setActiveTab(BadgeDetailsTabViews.awardedMembers)
    }

    // default tab
    let activeTabElement: JSX.Element
        = (
            <AwardedMembersTab
                badge={badgeDetailsHandler.data as GameBadge}
            />
        )
    if (activeTab === BadgeDetailsTabViews.manualAward) {
        activeTabElement = (
            <ManualAwardTab
                badge={badgeDetailsHandler.data as GameBadge}
                onManualAssign={onAssign}
            />
        )
    }

    if (activeTab === BadgeDetailsTabViews.batchAward) {
        activeTabElement = (
            <BatchAwardTab
                badge={badgeDetailsHandler.data as GameBadge}
                onBatchAssign={onAssign}
            />
        )
    }

    // show page loader if we fetching results
    if (!badgeDetailsHandler.data && !badgeDetailsHandler.error) {
        return <LoadingSpinner />
    }

    return (
        <ContentLayout
            title='Badge Detail'
            buttonConfig={headerButtonConfig}
            secondaryButtonConfig={{
                label: 'Back',
                onClick: () => {
                    navigate('./../../')
                },
            }}
        >
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
                                        size='lg'
                                        icon={IconOutline.PencilIcon}
                                        className={styles.filePickerPencil}
                                        onClick={handleBadgeEditClick}
                                    />
                                    <img
                                        src={fileDataURL || badgeDetailsHandler.data?.badge_image_url}
                                        alt='badge media preview'
                                    />
                                    <input
                                        type='file'
                                        ref={fileInputRef}
                                        className={styles.filePickerInput}
                                        accept={ACCEPTED_BADGE_MIME_TYPES}
                                        size={MAX_BADGE_IMAGE_FILE_SIZE}
                                        onChange={validateFilePicked}
                                    />
                                </div>
                                <div className={styles.badgeDetails}>
                                    <ContentEditable
                                        innerRef={badgeNameRef}
                                        html={badgeDetailsHandler.data?.badge_name as string}
                                        onChange={handleContentChange}
                                        onKeyDown={onNameEditKeyDown}
                                        onBlur={onSaveBadgeName}
                                        onFocus={onBadgeNameEditFocus}
                                        className={styles.badgeName}
                                    />
                                    {
                                        badgeNameErrorText && (
                                            <div className={styles.error}>
                                                <IconSolid.ExclamationIcon />
                                                {badgeNameErrorText}
                                            </div>
                                        )
                                    }
                                    <div className={styles.badgeDesc}>
                                        <div className={styles.badgeEditWrap}>
                                            <ContentEditable
                                                innerRef={badgeDescRef}
                                                html={
                                                    isBadgeDescEditingMode
                                                        ? badgeDetailsHandler.data?.badge_description as string
                                                        : md.render(
                                                            badgeDetailsHandler.data?.badge_description as string,
                                                        )
                                                }
                                                onChange={noop}
                                                onFocus={handleContentEditFocus}
                                                className={
                                                    isBadgeDescEditingMode
                                                        ? styles.badgeEditableMode
                                                        : styles.badgeEditable
                                                }
                                            />
                                            {
                                                isBadgeDescEditingMode && (
                                                    <div className={styles.badgeEditActions}>
                                                        <Button
                                                            label='Cancel'
                                                            secondary
                                                            size='sm'
                                                            onClick={cancelEditBadge}
                                                        />
                                                        <Button
                                                            label='Save'
                                                            primary
                                                            size='sm'
                                                            onClick={onSaveBadgeDesc}
                                                        />
                                                    </div>
                                                )
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
            {
                badgeDetailsHandler.data
                && (
                    <BadgeActivatedModal
                        isOpen={showActivatedModal}
                        onClose={hideActivateModal}
                        badge={badgeDetailsHandler.data}
                    />
                )
            }
        </ContentLayout>
    )
}

export default BadgeDetailPage
