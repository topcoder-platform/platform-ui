import { FormDefinition } from "..";

export const FormConfig: FormDefinition = {
  rightButtons: [
    {
      type: 'button',
      buttonStyle: 'secondary',
      label: 'Save for later',
      onClick: () => console.log('on click'),
    },
    {
      type: 'button',
      buttonStyle: 'primary',
      label: 'Complete and pay',
      onClick: () => console.log('on click'),
    }
  ],
  elements: [
    {
      type: 'field',
      field: {
        name: 'Project title',
        label: 'Project title',
        placeholder: 'Enter a descriptive title',
        type: 'text',
        events: [
          {
            name: 'onBlur',
            event: () => console.log('on blur')
          }
        ],
      },
    },
    {
      type: 'field',
      field: {
        name: 'Project title',
        label: 'Project title',
        placeholder: 'Enter a descriptive title',
        type: 'text',
        events: [
          {
            name: 'onBlur',
            event: () => console.log('on blur')
          }
        ],
      },
    },
  ],
};