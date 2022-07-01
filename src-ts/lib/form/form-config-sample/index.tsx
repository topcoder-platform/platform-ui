import { FormDefinition } from "..";

export const FormConfig: FormDefinition = {
  leftButtons: [
    {
      type: 'button',
      buttonStyle: 'icon',
      onClick: () => console.log('on click'),
    }
  ],
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
  sections: [
    {
      type: {
        byFieldsNumber: 'MultiComponent',
        byWidth: 'HalfWidth',
      },
      title: 'Project Title',
      description: 'Enter a title for your website bug hunt project.',
      fields: [
        {
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
        }
      ],
    },
    {
      type: {
        byFieldsNumber: 'MultiComponent',
        byWidth: 'HalfWidth',
      },
      title: 'Website URL',
      description: 'Enter a title for your website bug hunt project.',
      fields: [
        {
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
        }
      ],
    }
  ],
};