import { FormDefinition, FormInputAutocompleteOption, validatorRequired } from '../../../../lib'

export const editNameFormTitle: string = 'Edit Name'

export enum EditNameFieldName {
    firstName = 'firstName',
    lastName = 'lastName',
}

export const editNameFormDef: FormDefinition = {
    elements: [
        {
            field: {
                autocomplete: FormInputAutocompleteOption.off,
                label: 'First Name',
                name: EditNameFieldName.firstName,
                type: 'text',
                validators: [
                    {
                        validator: validatorRequired,
                    },
                ],
            },
            type: 'field',
        },
        {
            field: {
                autocomplete: FormInputAutocompleteOption.off,
                label: 'Last Name',
                name: EditNameFieldName.lastName,
                type: 'text',
                validators: [
                    {
                        validator: validatorRequired,
                    },
                ],
            },
            type: 'field',
        },
    ],
    rightButtons: [
        {
            buttonStyle: 'secondary',
            isSave: true,
            label: 'Save',
            size: 'lg',
            type: 'submit',
        },
    ],
    shortName: 'Name',
    tabIndexStart: 3,
    title: editNameFormTitle,
}
