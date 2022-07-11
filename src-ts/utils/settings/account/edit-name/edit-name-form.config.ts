import { FormDefinition, FormFieldType, FormInputAutocompleteOption, FormInputTypes, validatorRequired } from '../../../../lib'

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
                type: FormInputTypes.text,
                validators: [
                    {
                        validator: validatorRequired,
                    },
                ],
            },
            type: FormFieldType.field,
        },
        {
            field: {
                autocomplete: FormInputAutocompleteOption.off,
                label: 'Last Name',
                name: EditNameFieldName.lastName,
                type: FormInputTypes.text,
                validators: [
                    {
                        validator: validatorRequired,
                    },
                ],
            },
            type: FormFieldType.field,
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
