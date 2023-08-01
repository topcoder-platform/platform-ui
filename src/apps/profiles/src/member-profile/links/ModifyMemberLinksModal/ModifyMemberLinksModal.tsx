import { reject } from 'lodash'
import { FC, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Button } from '~/libs/ui'
import {
    createMemberTraitsAsync,
    updateMemberTraitsAsync,
    UserProfile,
    UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'

import { LinkEntry } from './LinkEntry'
import styles from './ModifyMemberLinksModal.module.scss'

interface ModifyMemberLinksModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
    memberLinks: UserTrait[] | undefined
    memberPersonalizationTraitsFullData: UserTrait[] | undefined
}

const methodsMap: { [key: string]: any } = {
    create: createMemberTraitsAsync,
    update: updateMemberTraitsAsync,
}

const ModifyMemberLinksModal: FC<ModifyMemberLinksModalProps> = (props: ModifyMemberLinksModalProps) => {
    const inputRef = useRef<HTMLInputElement | any>()

    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [hasChanges, setHasChanges] = useState<boolean>(false)
    const [currentMemberLinks, setCurrentMemberLinks] = useState<UserTrait[] | undefined>(props.memberLinks ?? [{}])

    const hasNewInput = useMemo(() => (
        !!currentMemberLinks?.find(d => (!d.name && !d.url))
    ), [currentMemberLinks])

    function handleAddAdditional(): void {
        if (hasNewInput) {
            return
        }

        setCurrentMemberLinks(links => (links ?? []).concat({ name: '', url: '' }))
    }

    function handleRemoveLink(trait: UserTrait): void {
        setCurrentMemberLinks(
            currentMemberLinks?.filter((item: UserTrait) => item.url !== trait.url),
        )
        setHasChanges(true)
    }

    async function handleSaveLink(link: UserTrait, index: number): Promise<UserTrait | undefined> {
        const existingLinkItemIndex = currentMemberLinks?.findIndex((item: UserTrait) => (
            item.url?.toLowerCase() === link?.url?.toLowerCase()
        )) ?? -1
        const isDuplicateLink = existingLinkItemIndex > -1 && existingLinkItemIndex !== index

        if (isDuplicateLink) {
            toast.info('Link already exists', { position: toast.POSITION.BOTTOM_RIGHT })
            return undefined
        }

        setCurrentMemberLinks(links => (links ?? []).map((l, i) => (
            i === index ? link : l
        )))

        setHasChanges(true)
        return link
    }

    function handleLinksSave(): void {
        setIsSaving(true)

        const updatedPersonalizationTraits: UserTrait[]
            = reject(props.memberPersonalizationTraitsFullData, (trait: UserTrait) => trait.links)

        const updatedLinks: UserTrait[] = [
            ...(currentMemberLinks || []),
        ].filter(l => l.name && l.url)

        methodsMap[!!props.memberPersonalizationTraitsFullData ? 'update' : 'create'](props.profile.handle, [{
            categoryName: UserTraitCategoryNames.personalization,
            traitId: UserTraitIds.personalization,
            traits: {
                data: [
                    ...(updatedPersonalizationTraits || []),
                    {
                        links: updatedLinks,
                    },
                ],
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

                <div className={classNames(styles.links, currentMemberLinks?.length ? '' : styles.noLinks)}>
                    {
                        currentMemberLinks?.map((trait: UserTrait, i: number) => (
                            <LinkEntry
                                link={trait}
                                onRemove={handleRemoveLink}
                                onSave={handleSaveLink}
                                index={i}
                                // eslint-disable-next-line react/no-array-index-key
                                key={`${trait.url}-${i}`}
                            />
                        ))
                    }
                </div>

                {!hasNewInput && (
                    <div className={styles.formCTAs}>
                        <Button
                            onClick={handleAddAdditional}
                            secondary
                            label='+ Additional Link'
                        />
                    </div>
                )}

            </div>
        </BaseModal>
    )
}

export default ModifyMemberLinksModal
