import { FormDefinition, FormInputAutocompleteOption, FormInputTypes, validatorRequired } from '../../../../lib'

export const editNameFormTitle: string = 'Edit Name'

export enum EditNameFieldName {
    firstName = 'firstName',
    lastName = 'lastName',
}

export const editNameFormDef: FormDefinition = {
    buttons: {
        left: [],
        right: [
            {
                buttonStyle: 'secondary',
                isSave: true,
                label: 'Save',
                size: 'lg',
                type: 'submit',
            },
        ],
    },
    groups: [
        {
            fields: [
                {
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
            ],
        },
        {
            fields: [
                {
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
            ],
        },
    ],
    shortName: 'Name',
    tabIndexStart: 3,
    title: editNameFormTitle,
}
