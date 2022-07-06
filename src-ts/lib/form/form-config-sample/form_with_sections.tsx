import { FormDefinition } from '..'
import { ReactComponent as BackIcon } from '../../../../src/assets/images/icon-back-arrow.svg'
export const FormConfig: FormDefinition = {
  elements: [
    {
      description: 'Enter a title for your website bug hunt project.',
      fields: [
        {
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
      ],
      renderingRule: {
        width: 'half',
      },
      title: 'Project Title',
      type: 'section',
    },
    {
      description: 'Enter a title for your website bug hunt project.',
      fields: [
        {
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
      ],
      renderingRule: {
        width: 'half',
      },
      title: 'Website URL',
      type: 'section',
    },
    {
      description: 'Do you have any specific goals for your website bug hunt? For example: find bugs in my online shopping experience',
      fields: [
        {
          events: [
            {
              event: () => {},
              name: 'onBlur',
            },
          ],
          label: 'Project title',
          name: 'bug-hunt-goals',
          placeholder: 'Describe your goal',
          type: 'textarea',
        },
      ],
      renderingRule: {
        width: 'half',
      },
      title: 'Bug Hunt Goals',
      type: 'section',
    },
    {
      description: 'Are there specific features we should focus on testing? For example: [An example not used above]',
      fields: [
        {
          events: [
            {
              event: () => {},
              name: 'onBlur',
            },
          ],
          label: 'Features to test (optional)',
          name: 'bug-hunt-goals',
          placeholder: 'List the sepcific features',
          type: 'textarea',
        },
      ],
      renderingRule: {
        width: 'half',
      },
      title: 'Features to test',
      type: 'section',
    },
    {
      description: 'How do you want your bugs delivered?',
      fields: [
        {
          name: 'delivery-type',
          notTabbable: false,
          onChange: () => {},
          options: [
            {
              checked: false,
              children: () => (<div>Option 1</div>),
              id: 'github',
            },
            {
              checked: false,
              children: () => (<div>Option 2</div>),
              id: 'gitlab',
            },
          ],
          type: 'checkbox',
          value: true,
        },
        {
          events: [
            {
              event: () => {},
              name: 'onBlur',
            },
          ],
          label: 'Repository Link (Optional)',
          name: 'repository-link',
          placeholder: 'www.example-share-link.com',
          type: 'text',
        },
      ],
      renderingRule: {
        width: 'half',
      },
      title: 'Bug Delivery',
      type: 'section',
    },
  ],
  leftButtons: [
    {
      buttonStyle: 'icon',
      icon: BackIcon,
      onClick: () => {},
      type: 'button',
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
