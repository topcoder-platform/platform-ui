import { bind, reject, trim } from 'lodash'
import { Dispatch, FC, MutableRefObject, SetStateAction, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Button, IconOutline, InputSelect, InputText } from '~/libs/ui'
import { updateMemberTraitsAsync, UserProfile, UserTrait, UserTraitCategoryNames, UserTraitIds } from '~/libs/core'

import { renderLinkIcon } from '../MemberLinks'

import { linkTypes } from './link-types.config'
import styles from './ModifyMemberLinksModal.module.scss'

interface ModifyMemberLinksModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
    memberLinks: UserTrait[] | undefined
    memberPersonalizationTraitsFullData: UserTrait[] | undefined
}

const ModifyMemberLinksModal: FC<ModifyMemberLinksModalProps> = (props: ModifyMemberLinksModalProps) => {
    const formElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isFormChanged, setIsFormChanged]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [formErrors, setFormErrors]: [
        { [key: string]: string },
        Dispatch<SetStateAction<{ [key: string]: string }>>
    ]
        = useState<{ [key: string]: string }>({})

    const [selectedLinkType, setSelectedLinkType]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ]
        = useState<string | undefined>()

    const [currentMemberLinks, setCurrentMemberLinks]: [
        UserTrait[] | undefined,
        Dispatch<SetStateAction<UserTrait[] | undefined>>
    ]
        = useState<UserTrait[] | undefined>(props.memberLinks)

    const linkTypesSelect: any = useMemo(() => linkTypes.map((link: any) => ({
        label: link.name,
        value: link.name,
    })), [])

    const [selectedLinkURL, setSelectedLinkURL]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ]
        = useState<string | undefined>()

    function handleSelectedLinkTypeChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedLinkType(event.target.value)
    }

    function handleLinksSave(): void {
        setIsSaving(true)

        const updatedPersonalizationTraits: UserTrait[]
            = reject(props.memberPersonalizationTraitsFullData, (trait: UserTrait) => trait.links)

        updateMemberTraitsAsync(props.profile.handle, [{
            categoryName: UserTraitCategoryNames.personalization,
            traitId: UserTraitIds.personalization,
            traits: {
                data: [
                    ...(updatedPersonalizationTraits || []),
                    {
                        links: currentMemberLinks,
                    },
                ],
            },
        }])
            .then(() => {
                toast.success('Links updated successfully.')
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update user Links.')
                setIsSaving(false)
            })
    }

    function handleFormAction(): void {
        if (!selectedLinkType) {
            setFormErrors({ selectedLinkType: 'Please select a link type' })
            return
        }

        if (!trim(selectedLinkURL)) {
            setFormErrors({ url: 'Please enter a URL' })
            return
        }

        let url: URL
        try {
            url = new URL(selectedLinkURL as string)
        } catch (e) {
            setFormErrors({ url: 'Invalid URL' })
            return
        }

        if (!url.protocol || !url.hostname) {
            setFormErrors({ url: 'Invalid URL' })
            return
        }

        if (currentMemberLinks?.find((item: UserTrait) => item.url.toLowerCase() === selectedLinkURL?.toLowerCase())) {
            toast.info('Link already exists')
            resetForm()
            return
        }

        setCurrentMemberLinks([
            ...(currentMemberLinks || []),
            {
                name: selectedLinkType,
                url: trim(selectedLinkURL) || '',
            },
        ])

        setIsFormChanged(true)
        resetForm()
    }

    function resetForm(): void {
        formElRef.current.reset()
        setSelectedLinkType(undefined)
        setSelectedLinkURL(undefined)
        setFormErrors({})
    }

    function handleRemoveLink(trait: UserTrait): void {
        setCurrentMemberLinks(
            currentMemberLinks?.filter((item: UserTrait) => item.url !== trait.url),
        )
        setIsFormChanged(true)
    }

    function handleURLChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedLinkURL(event.target.value)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='My Links'
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
                        disabled={isSaving || !isFormChanged}
                    />
                </div>
            )}
        >
            <div className={styles.container}>
                <div className={classNames(styles.links, currentMemberLinks?.length ? '' : styles.noLinks)}>
                    {
                        currentMemberLinks?.map((trait: UserTrait) => (
                            <div className={styles.linkItemWrap} key={`member-link-${trait.name}`}>
                                <div className={styles.linkItem}>
                                    {renderLinkIcon(trait.name)}
                                    <p>{trait.url}</p>
                                </div>
                                <Button
                                    icon={IconOutline.TrashIcon}
                                    onClick={bind(handleRemoveLink, this, trait)}
                                />
                            </div>
                        ))
                    }
                </div>

                <form
                    ref={formElRef}
                    className={classNames(styles.formWrap)}
                >
                    <div className={styles.form}>
                        <InputSelect
                            options={linkTypesSelect}
                            value={selectedLinkType}
                            onChange={handleSelectedLinkTypeChange}
                            name='linkType'
                            label='Type *'
                            error={formErrors.selectedLinkType}
                            placeholder='Select a link type'
                            dirty
                        />

                        <InputText
                            name='url'
                            label='URL *'
                            error={formErrors.url}
                            placeholder='Enter a URL'
                            dirty
                            tabIndex={-1}
                            type='text'
                            onChange={handleURLChange}
                            value={selectedLinkURL}
                        />

                        <div className={styles.formCTAs}>
                            <Button
                                icon={IconOutline.PlusCircleIcon}
                                onClick={handleFormAction}
                                size='xl'
                            />
                        </div>
                    </div>
                </form>
            </div>
        </BaseModal>
    )
}

export default ModifyMemberLinksModal
