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
      renderingRule: {
        width: 'half',
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
      renderingRule: {
        width: 'half',
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
    },
    {
      renderingRule: {
        width: 'half',
      },
      title: 'Bug Hunt Goals',
      description: 'Do you have any specific goals for your website bug hunt? For example: find bugs in my online shopping experience',
      fields: [
        {
          name: 'bug-hunt-goals',
          label: 'Project title',
          placeholder: 'Describe your goal',
          type: 'textarea',
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
      renderingRule: {
        width: 'half',
      },
      title: 'Features to test',
      description: 'Are there specific features we should focus on testing? For example: [An example not used above]',
      fields: [
        {
          name: 'bug-hunt-goals',
          label: 'Features to test (optional)',
          placeholder: 'List the sepcific features',
          type: 'textarea',
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
      renderingRule: {
        width: 'half',
      },
      title: 'Bug Delivery',
      description: 'How do you want your bugs delivered?',
      fields: [
        {
          name: 'delivery-type',
          type: 'checkbox',
          options: [
            {
              checked: false,
              children: () => (<div>Option 1</div>),
            },
            {
              checked: false,
              children: () => (<div>Option 2</div>),
            }
          ],
        },
        {
          name: 'repository-link',
          label: 'Repository Link (Optional)',
          placeholder: 'www.example-share-link.com',
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