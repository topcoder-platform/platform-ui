import { FormDefinition, FormInputAutocompleteOption, validatorRequired } from '../../../../lib'

export const editNameFormTitle: string = 'Edit Name'

export enum EditNameFieldName {
    firstName = 'firstName',
    lastName = 'lastName',
}

export const editNameFormDef: FormDefinition = {
    buttons: [
        {
            buttonStyle: 'secondary',
            isSave: true,
            label: 'Save',
            size: 'lg',
            type: 'submit',
        },
    ],
    inputs: [
        {
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
        {
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
    ],
    shortName: 'Name',
    tabIndexStart: 3,
    title: editNameFormTitle,
}
