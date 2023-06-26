import { bind, sortBy } from 'lodash'
import { Dispatch, FC, MutableRefObject, SetStateAction, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Button, IconOutline, InputSelect } from '~/libs/ui'
import { updateMemberTraitsAsync, UserProfile, UserTrait, UserTraitCategoryNames, UserTraitIds } from '~/libs/core'

import { LanguageCard } from '../LanguageCard'

import dropDowns from './dropdowns.json'
import styles from './ModifyLanguagesModal.module.scss'

interface ModifyLanguagesModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
    memberLanguages: UserTrait[] | undefined
}

const ModifyLanguagesModal: FC<ModifyLanguagesModalProps> = (props: ModifyLanguagesModalProps) => {
    const formElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isFormChanged, setIsFormChanged]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const [formErrors, setFormErrors]: [
        { [key: string]: string },
        Dispatch<SetStateAction<{ [key: string]: string }>>
    ]
        = useState<{ [key: string]: string }>({})

    const [selectedLanguage, setSelectedLanguage]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ]
        = useState<string | undefined>()

    const [selectedSpokenLevel, setSelectedSpokenLevel]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ]
        = useState<string | undefined>()

    const [selectedWrittenLevel, setSelectedWrittenLevel]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ]
        = useState<string | undefined>()

    const languages: any = useMemo(() => sortBy(
        dropDowns.language.map(lang => ({ label: lang.label, value: lang.label })),
        'label',
    ), [])

    const spokenLevel: any = useMemo(() => sortBy(
        dropDowns.spokenLevel.map(lang => ({ label: lang.label, value: lang.label })),
        'label',
    ), [])

    const writtenLevel: any = useMemo(() => sortBy(
        dropDowns.writtenLevel.map(lang => ({ label: lang.label, value: lang.label })),
        'label',
    ), [])

    const [currentMemberLanguages, setCurrentMemberLanguages]: [
        UserTrait[] | undefined,
        Dispatch<SetStateAction<UserTrait[] | undefined>>
    ]
        = useState<UserTrait[] | undefined>(props.memberLanguages)

    function handleSelectedLanguageChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedLanguage(event.target.value)
    }

    function handleSelectedSpokenLevelChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedSpokenLevel(event.target.value)
    }

    function handleSelectedWrittenLevelChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedWrittenLevel(event.target.value)
    }

    function handleLanguagesSave(): void {
        setIsSaving(true)

        updateMemberTraitsAsync(props.profile.handle, [{
            categoryName: UserTraitCategoryNames.languages,
            traitId: UserTraitIds.languages,
            traits: {
                data: currentMemberLanguages || [],
            },
        }])
            .then(() => {
                toast.success('Languages updated successfully.')
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update user Languages.')
                setIsSaving(false)
            })
    }

    function handleFormAction(): void {
        if (!selectedLanguage) {
            setFormErrors({ selectedLanguage: 'Please select a language' })
            return
        }

        if (!selectedSpokenLevel) {
            setFormErrors({ selectedSpokenLevel: 'Please select a spoken level' })
            return
        }

        if (!selectedWrittenLevel) {
            setFormErrors({ selectedWrittenLevel: 'Please select a written level' })
            return
        }

        if (currentMemberLanguages?.find((item: UserTrait) => item.language === selectedLanguage)) {
            toast.info('Language already exists')
            resetForm()
            return
        }

        setCurrentMemberLanguages([
            ...(currentMemberLanguages || []),
            {
                language: selectedLanguage,
                spokenLevel: selectedSpokenLevel,
                writtenLevel: selectedWrittenLevel,
            },
        ])
        setIsFormChanged(true)
        resetForm()
    }

    function handleCancelEditMode(): void {
        resetForm()
    }

    function resetForm(): void {
        formElRef.current.reset()
        setIsEditMode(false)
        setSelectedLanguage(undefined)
        setSelectedSpokenLevel(undefined)
        setSelectedWrittenLevel(undefined)
        setFormErrors({})
    }

    function handleRemoveLanguage(trait: UserTrait): void {
        setCurrentMemberLanguages(
            currentMemberLanguages?.filter((item: UserTrait) => item.language !== trait.language),
        )
        setIsFormChanged(true)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='My Languages'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleLanguagesSave}
                        primary
                        disabled={isSaving || !isFormChanged}
                    />
                </div>
            )}
        >
            <div className={styles.container}>
                <div className={classNames(styles.languages, currentMemberLanguages?.length ? '' : styles.noLanguages)}>
                    {
                        currentMemberLanguages?.map((trait: UserTrait) => (
                            <div className={styles.languageItemWrap} key={`member-lan-${trait.language}`}>
                                <LanguageCard trait={trait} />
                                <Button
                                    icon={IconOutline.TrashIcon}
                                    onClick={bind(handleRemoveLanguage, this, trait)}
                                />
                            </div>
                        ))
                    }
                </div>

                <p>Add Languages</p>
                <form
                    ref={formElRef}
                    className={classNames(styles.formWrap)}
                >
                    <div className={styles.form}>
                        <InputSelect
                            options={languages}
                            value={selectedLanguage}
                            onChange={handleSelectedLanguageChange}
                            name='languages'
                            label='Language *'
                            error={formErrors.selectedLanguage}
                            placeholder='Select a Language'
                            dirty
                        />

                        <InputSelect
                            options={spokenLevel}
                            value={selectedSpokenLevel}
                            onChange={handleSelectedSpokenLevelChange}
                            name='spokenLevel'
                            label='Spoken Level *'
                            error={formErrors.selectedSpokenLevel}
                            placeholder='Select a Spoken Level'
                            dirty
                        />

                        <InputSelect
                            options={writtenLevel}
                            value={selectedWrittenLevel}
                            onChange={handleSelectedWrittenLevelChange}
                            name='writtenLevel'
                            label='Written Level *'
                            error={formErrors.selectedWrittenLevel}
                            placeholder='Select a Written Level'
                            dirty
                        />

                        <div className={styles.formCTAs}>
                            {!isEditMode && <IconOutline.PlusCircleIcon />}
                            <Button
                                link
                                label={`${isEditMode ? 'Edit' : 'Add'} Language to your List`}
                                onClick={handleFormAction}
                            />
                            {isEditMode && (
                                <Button
                                    className={styles.ctaBtnCancel}
                                    link
                                    label='Cancel'
                                    onClick={handleCancelEditMode}
                                />
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </BaseModal>
    )
}

export default ModifyLanguagesModal
