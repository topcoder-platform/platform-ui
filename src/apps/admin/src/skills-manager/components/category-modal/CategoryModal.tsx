import { FC, useCallback, useMemo, useState } from 'react'

import { BaseModal, Form, formGetInputModel, FormInputModel, FormValue, LoadingSpinner } from '~/libs/ui'

import { saveStandardizedSkillCategory, StandardizedSkillCategory } from '../../services'

import { categoryFormDef, CategoryFormField } from './category-form.config'

interface CategoryModalProps {
    category: StandardizedSkillCategory
    onClose: () => void
    onSave: () => void
}

const CategoryModal: FC<CategoryModalProps> = props => {
    const action = props.category?.id ? 'edit' : 'add'

    const [loading, setLoading] = useState<boolean>(false)

    const generateRequest = useCallback((inputs: ReadonlyArray<FormInputModel>): FormValue => ({
        description: formGetInputModel(inputs, CategoryFormField.description).value as string,
        id: props.category.id as string,
        name: formGetInputModel(inputs, CategoryFormField.name).value as string,
    }), [])

    const saveAsync = useCallback(async (request: FormValue): Promise<void> => {
        setLoading(true)

        return saveStandardizedSkillCategory(request as unknown as StandardizedSkillCategory)
            .then(() => {
                props.onSave.call(undefined)
                props.onClose.call(undefined)
            })
            .catch((e: any) => {
                setLoading(false)
                return Promise.reject(e)
            })
    }, [props.onClose, props.onSave])

    const formDef = useMemo(() => ({
        ...categoryFormDef,
        buttons: {
            primaryGroup: categoryFormDef.buttons.primaryGroup.map(btn => ({
                ...btn,
                ...(btn.isSubmit ? {} : { onClick: props.onClose }),
            })),
        },
    }), [props.onClose])

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title={`${action} Category`}
        >
            <Form
                key='edit-category'
                formDef={formDef}
                formValues={props.category as unknown as FormValue}
                requestGenerator={generateRequest}
                save={saveAsync}
                resetFormOnUnmount
            />
            <LoadingSpinner hide={!loading} overlay />
        </BaseModal>
    )
}

export default CategoryModal
