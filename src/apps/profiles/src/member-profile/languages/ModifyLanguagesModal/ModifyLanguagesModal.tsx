import { bind, compact, sortBy, uniq, values } from 'lodash'
import { Dispatch, FC, MutableRefObject, SetStateAction, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Button, IconOutline, InputSelect } from '~/libs/ui'
import {
    updateOrCreateMemberTraitsAsync,
    UserProfile,
    UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'

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

    const languages: any = useMemo(() => sortBy(
        dropDowns.language.map(lang => ({ label: lang.label, value: lang.label })),
        'label',
    ), [])

    const [currentMemberLanguages, setCurrentMemberLanguages]: [
        UserTrait[] | undefined,
        Dispatch<SetStateAction<UserTrait[] | undefined>>
    ]
        = useState<UserTrait[] | undefined>(props.memberLanguages)

    const [formValues, setFormValues]: [
        { [key: string]: string | boolean | Date | undefined },
        Dispatch<SetStateAction<{ [key: string]: string | boolean | Date | undefined }>>
    ]
        = useState<{ [key: number]: string | boolean | Date | undefined }>({
            1: undefined,
        })

    function handleSelectedLanguageChange(key: string, event: React.ChangeEvent<HTMLInputElement>): void {
        setFormValues({
            ...formValues,
            [key]: event.target.value,
        })
        setIsFormChanged(true)
    }

    function handleLanguagesSave(): void {
        const formLanguages = uniq(compact(values(formValues)))

        if (formLanguages.length) {
            const filteredLanguages = formLanguages
                .filter((item: any) => !currentMemberLanguages?.find((trait: UserTrait) => trait.language === item))

            if (filteredLanguages.length) {
                setCurrentMemberLanguages([
                    ...(currentMemberLanguages || []),
                    ...filteredLanguages.map((item: any) => ({
                        language: item,
                    })),
                ])
            }

            resetForm()
            return
        }

        setIsSaving(true)

        updateOrCreateMemberTraitsAsync(props.profile.handle, [{
            categoryName: UserTraitCategoryNames.languages,
            traitId: UserTraitIds.languages,
            traits: {
                data: currentMemberLanguages || [],
            },
        }])
            .then(() => {
                toast.success('Languages updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update your Languages.', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
            })
    }

    function resetForm(): void {
        formElRef.current.reset()
        setFormValues({
            1: undefined,
        })
    }

    function handleRemoveLanguage(trait: UserTrait): void {
        setCurrentMemberLanguages(
            currentMemberLanguages?.filter((item: UserTrait) => item.language !== trait.language),
        )
        setIsFormChanged(true)
    }

    function handleAddAdditionalLanguage(): void {
        const keys = Object.keys(formValues)

        if (keys.length < 5) {
            setFormValues({
                ...formValues,
                [keys.length + 1]: undefined,
            })
        }
    }

    return (
        <BaseModal
            bodyClassName={styles.langModalBody}
            classNames={{
                modal: styles.langModal,
            }}
            onClose={props.onClose}
            open
            size='lg'
            initialFocusRef={formElRef}
            title='Languages'
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
                <p>What languages do you speak?</p>

                <div className={classNames(styles.languages)}>
                    {
                        currentMemberLanguages?.map((trait: UserTrait) => (
                            <div className={styles.languageItemWrap} key={`member-lan-${trait.language}`}>
                                <LanguageCard trait={trait} />
                                <Button
                                    icon={IconOutline.TrashIcon}
                                    onClick={bind(handleRemoveLanguage, this, trait)}
                                    size='lg'
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
                        {
                            Object.keys(formValues)
                                .map((key: string) => (
                                    <InputSelect
                                        options={languages}
                                        value={formValues[key] as string}
                                        onChange={bind(handleSelectedLanguageChange, this, key)}
                                        name='languages'
                                        label='Language'
                                        placeholder='Select a language from the list'
                                        key={`language-${key}`}
                                    />
                                ))
                        }
                        <Button
                            label='+ Additional Language'
                            secondary
                            onClick={handleAddAdditionalLanguage}
                        />
                    </div>
                </form>
            </div>
        </BaseModal>
    )
}

export default ModifyLanguagesModal
