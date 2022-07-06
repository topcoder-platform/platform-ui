import { FormDefinition } from '..'

export const FormConfig: FormDefinition = {
  elements: [
    {
      field: {
        events: [
          {
            event: () => {},
            name: 'onBlur',
          },
        ],
        label: 'Project title',
        name: 'Project title',
        placeholder: 'Enter a descriptive title',
        type: 'text',
      },
      type: 'field',
    },
    {
      field: {
        events: [
          {
            event: () => {},
            name: 'onBlur',
          },
        ],
        label: 'Project title',
        name: 'Project title',
        placeholder: 'Enter a descriptive title',
        type: 'text',
      },
      type: 'field',
    },
  ],
  rightButtons: [
    {
      buttonStyle: 'secondary',
      label: 'Save for later',
      onClick: () => {},
      type: 'button',
    },
    {
      buttonStyle: 'primary',
      label: 'Complete and pay',
      onClick: () => {},
      type: 'button',
    },
  ],
}
