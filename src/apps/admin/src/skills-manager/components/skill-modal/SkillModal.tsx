import { FC, ReactNode, useCallback, useMemo, useState } from 'react'

import { BaseModal, Form, formGetInputModel, FormInputModel, FormValue, LoadingSpinner } from '~/libs/ui'

import {
    archiveStandardizedSkill,
    saveStandardizedSkill,
    StandardizedSkill,
    StandardizedSkillCategory,
} from '../../services'

import { skillFormDef, SkillFormField } from './skill-form.config'

interface SkillModalProps {
    skill: StandardizedSkill
    categories: StandardizedSkillCategory[]
    onClose: () => void
    onSave: () => void
}

const SkillModal: FC<SkillModalProps> = props => {
    const action = props.skill?.id ? 'edit' : 'add'

    const [loading, setLoading] = useState<boolean>(false)

    const generateRequest = useCallback((inputs: ReadonlyArray<FormInputModel>): FormValue => ({
        categoryId: formGetInputModel(inputs, SkillFormField.category).value as string,
        description: formGetInputModel(inputs, SkillFormField.description).value as string,
        id: props.skill.id as string,
        name: formGetInputModel(inputs, SkillFormField.name).value as string,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [])

    const saveAsync = useCallback(async (request: FormValue): Promise<void> => {
        setLoading(true)

        return saveStandardizedSkill(request as unknown as StandardizedSkill)
            .then(() => {
                props.onSave.call(undefined)
                props.onClose.call(undefined)
            })
            .catch((e: any) => {
                setLoading(false)
                return Promise.reject(e)
            })
    }, [props.onClose, props.onSave])

    const archiveSkill = useCallback(async (): Promise<void> => {
        setLoading(true)

        return archiveStandardizedSkill(props.skill)
            .then(() => {
                props.onSave.call(undefined)
                props.onClose.call(undefined)
            })
            .catch((e: any) => {
                setLoading(false)
                return Promise.reject(e)
            })
    }, [props.onClose, props.skill, props.onSave])

    const formDef = useMemo(() => skillFormDef(
        action,
        archiveSkill,
        props.onClose,
        props.categories,
    ), [action, archiveSkill, props.categories, props.onClose])

    const formValue = useMemo(() => ({
        ...(props.skill as any),
        categoryId: props.skill.category?.id,
    } as FormValue), [props.skill])

    function renderForm(): ReactNode {
        return (
            <Form
                formDef={formDef}
                formValues={formValue}
                requestGenerator={generateRequest}
                save={saveAsync}
                resetFormOnUnmount
            />
        )
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title={`${action} Skill`}
        >
            {renderForm()}
            <LoadingSpinner hide={!loading} overlay />
        </BaseModal>
    )
}

export default SkillModal
