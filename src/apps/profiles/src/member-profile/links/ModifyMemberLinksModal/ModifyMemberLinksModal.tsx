import { cloneDeep, findIndex, isEqual, omit, uniqBy } from 'lodash'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Button, IconOutline } from '~/libs/ui'
import {
    updateOrCreateMemberTraitsAsync,
    UserProfile,
    UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'
import { upsertTrait } from '~/libs/shared'

import { LinkForm, UserLink } from './LinkForm'
import { LinkFormHandle } from './LinkForm/LinkForm'
import styles from './ModifyMemberLinksModal.module.scss'

interface ModifyMemberLinksModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
    memberLinks: UserTrait[] | undefined
    memberPersonalizationTraitsFullData: UserTrait[] | undefined
}

const ModifyMemberLinksModal: FC<ModifyMemberLinksModalProps> = (props: ModifyMemberLinksModalProps) => {
    const inputRef = useRef<HTMLInputElement | any>()

    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [currentMemberLinks, setCurrentMemberLinks] = useState<UserTrait[]>(
        [],
    )
    const [defaultLinkedIn, setDefaultLinkedIn] = useState<UserTrait>({
        name: 'LinkedIn',
        url: '',
    })
    const [defaultGitHub, setDefaultGitHub] = useState<UserTrait>({
        name: 'GitHub',
        url: '',
    })
    const [defaultInstagram, setDefaultInstagram] = useState<UserTrait>({
        name: 'Instagram',
        url: '',
    })
    const [defaultLink, setDefaultLink] = useState<UserTrait>({
        name: '',
        url: '',
    })

    const updatedLinks = useMemo(() => uniqBy(
        [
            defaultLinkedIn,
            defaultGitHub,
            defaultInstagram,
            defaultLink,
            ...currentMemberLinks,
        ].filter(
            l => l.name && l.url,
        ),
        e => `${e.name}-${e.url}`,
    )
        .map(
            item => omit(item, ['id']),
        ), [defaultLinkedIn, defaultGitHub, defaultInstagram, defaultLink, currentMemberLinks])
    const hasChanges = useMemo(() => !isEqual(updatedLinks, props.memberLinks), [updatedLinks])

    const addNewLinkRef = useRef<LinkFormHandle>(null)

    useEffect(() => {
        const memberLinks = [
            ...cloneDeep(props.memberLinks ?? []),
        ]
        const firstLinkedInIndex = findIndex(memberLinks, {
            name: 'LinkedIn',
        })
        if (firstLinkedInIndex >= 0) {
            setDefaultLinkedIn(memberLinks.splice(firstLinkedInIndex, 1)[0])
        }

        const firstGitHubIndex = findIndex(memberLinks, {
            name: 'GitHub',
        })
        if (firstGitHubIndex >= 0) {
            setDefaultGitHub(memberLinks.splice(firstGitHubIndex, 1)[0])
        }

        const firstInstagramIndex = findIndex(memberLinks, {
            name: 'Instagram',
        })
        if (firstInstagramIndex >= 0) {
            setDefaultInstagram(memberLinks.splice(firstInstagramIndex, 1)[0])
        }

        if (memberLinks.length > 0) {
            setDefaultLink(memberLinks.splice(0, 1)[0])
        }

        setCurrentMemberLinks(memberLinks.map((item: UserTrait, index: number) => ({
            ...item,
            id: `id-${index}-${(new Date())
                .getTime()}`,
        })))

    }, [props.memberLinks])

    function handleAddAdditional(): void {
        setCurrentMemberLinks(links => [...links, {
            id: `id-${(new Date())
                .getTime()}`,
            ...defaultLink,
        }])
        setDefaultLink({
            name: '',
            url: '',
        })
        addNewLinkRef.current?.resetForm()
    }

    function handleRemoveLink(index: number): void {
        currentMemberLinks.splice(index, 1)
        setCurrentMemberLinks(
            [
                ...currentMemberLinks,
            ],
        )
    }

    function handleSaveLink(link: UserTrait, index: number): void {
        setCurrentMemberLinks(links => (links ?? []).map((l, i) => (
            i === index ? link : l
        )))
    }

    function handleLinksSave(): void {
        setIsSaving(true)

        const personalizationData = upsertTrait(
            'links',
            updatedLinks,
            props.memberPersonalizationTraitsFullData ?? [],
        )

        updateOrCreateMemberTraitsAsync(props.profile.handle, [{
            categoryName: UserTraitCategoryNames.personalization,
            traitId: UserTraitIds.personalization,
            traits: {
                data: personalizationData,
            },
        }])
            .then(() => {
                toast.success('Links updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update user Links.', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
            })
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='Social Links'
            bodyClassName={styles.memberLinksModalBody}
            initialFocusRef={inputRef}
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleLinksSave}
                        primary
                        disabled={isSaving || !hasChanges}
                    />
                </div>
            )}
        >
            <div className={styles.container}>
                <p>Provide links to your social accounts.</p>

                <div className={classNames(styles.links)}>
                    <LinkForm
                        link={defaultLinkedIn as UserLink}
                        onSave={function onSave(link: UserLink) {
                            setDefaultLinkedIn(link)
                        }}
                        onRemove={function onRemove() {
                            setDefaultLinkedIn({
                                ...defaultLinkedIn,
                                url: '',
                            })
                        }}
                        placeholder='Add URL'
                        removeIcon={IconOutline.XCircleIcon}
                        hideRemoveIcon={!defaultLinkedIn.url}
                        disabled={isSaving}
                        labelUrlField='Linkedin'
                    />
                    <LinkForm
                        link={defaultGitHub as UserLink}
                        onSave={function onSave(link: UserLink) {
                            setDefaultGitHub(link)
                        }}
                        onRemove={function onRemove() {
                            setDefaultGitHub({
                                ...defaultGitHub,
                                url: '',
                            })
                        }}
                        placeholder='Add URL'
                        removeIcon={IconOutline.XCircleIcon}
                        hideRemoveIcon={!defaultGitHub.url}
                        disabled={isSaving}
                        labelUrlField='Git'
                    />
                    <LinkForm
                        link={defaultInstagram as UserLink}
                        onSave={function onSave(link: UserLink) {
                            setDefaultInstagram(link)
                        }}
                        onRemove={function onRemove() {
                            setDefaultInstagram({
                                ...defaultInstagram,
                                url: '',
                            })
                        }}
                        placeholder='Add URL'
                        removeIcon={IconOutline.XCircleIcon}
                        hideRemoveIcon={!defaultInstagram.url}
                        disabled={isSaving}
                        labelUrlField='Instagram'
                    />
                </div>

                <hr className={styles.spacer} />

                <LinkForm
                    link={defaultLink as UserLink}
                    onSave={setDefaultLink}
                    allowEditType
                    placeholder='http://'
                    ref={addNewLinkRef}
                    disabled={isSaving}
                />

                <div className={styles.formCTAs}>
                    <Button
                        onClick={handleAddAdditional}
                        secondary
                        label='+ Additional Link'
                        disabled={isSaving}
                    />
                </div>

                {(currentMemberLinks.length > 0) && (
                    <div className={classNames(styles.links)}>
                        {
                            currentMemberLinks.map((trait: UserTrait, i: number) => (
                                <LinkForm
                                    link={trait as UserLink}
                                    onSave={function onSave(link: UserLink) {
                                        handleSaveLink({
                                            ...trait,
                                            ...link,
                                        }, i)
                                    }}
                                    onRemove={function onRemove() {
                                        handleRemoveLink(i)
                                    }}
                                    allowEditType
                                    placeholder='http://'
                                    disabled={isSaving}
                                    key={trait.id}
                                />
                            ))
                        }
                    </div>
                )}

            </div>
        </BaseModal>
    )
}

export default ModifyMemberLinksModal
