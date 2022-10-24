import { FormCard } from '../../../../../lib'

const BugHuntPricingConfig: Array<FormCard> = [
  {
      id: 'standard',
      price: 1499,
      sections: [
          {
              rows: [
                  {
                      icon: 'clock',
                      label: 'Hunt Duration',
                      text: 'Up to 24h',
                  },
                  {
                      icon: 'exclamation',
                      label: 'Number of Bugs',
                      text: 'Up to 50',
                  },
                  {
                      icon: 'user-group',
                      label: 'Number of Testers',
                      text: 'Up to 10',
                  },
                  {
                      icon: 'desktop-computer',
                      infoIcon: true,
                      label: 'Device Types',
                      text: 'Desktop',
                      tooltipText: 'Testers may use devtools or other emulator software to test',
                  },
                  {
                      infoIcon: true,
                      label: 'Latest browser testing',
                      tooltipText: 'Testing takes place on Chrome, Edge, Firefox and Safari',
                      valueIcon: 'check',
                  },
                  {
                      label: 'Detailed bug reporting',
                      valueIcon: 'check',
                  },
                  {
                      label: 'Expert verification',
                      valueIcon: 'check',
                  },
              ],
          },
      ],
      title: 'Standard',
  },
  {
      id: 'advanced',
      mostPopular: true,
      price: 1899,
      sections: [
          {
              rows: [
                  {
                      icon: 'clock',
                      label: 'Hunt Duration',
                      text: 'Up to 48h',
                  },
                  {
                      icon: 'exclamation',
                      label: 'Number of Bugs',
                      text: 'Up to 100',
                  },
                  {
                      icon: 'user-group',
                      label: 'Number of Testers',
                      text: 'Up to 25',
                  },
                  {
                      icon: 'desktop-computer',
                      infoIcon: true,
                      label: 'Device Types',
                      text: 'Desktop & Mobile',
                      tooltipText: 'Testers may use devtools or other emulator software to test',
                  },
                  {
                      infoIcon: true,
                      label: 'Latest browser testing',
                      tooltipText: 'Testing takes place on Chrome, Edge, Firefox and Safari',
                      valueIcon: 'check',
                  },
                  {
                      label: 'Detailed bug reporting',
                      valueIcon: 'check',
                  },
                  {
                      label: 'Expert verification',
                      valueIcon: 'check',
                  },
              ],
          },
      ],
      title: 'Advanced',
  },
  {
      id: 'premium',
      price: 2299,
      sections: [
          {
              rows: [
                  {
                      icon: 'clock',
                      label: 'Hunt Duration',
                      text: 'Up to 72h',
                  },
                  {
                      icon: 'exclamation',
                      label: 'Number of Bugs',
                      text: 'Up to 200',
                  },
                  {
                      icon: 'user-group',
                      label: 'Number of Testers',
                      text: 'Up to 50',
                  },
                  {
                      icon: 'desktop-computer',
                      infoIcon: true,
                      label: 'Device Types',
                      text: 'Desktop, Tablet & Mobile',
                      tooltipText: 'Testers may use devtools or other emulator software to test',
                  },
                  {
                      infoIcon: true,
                      label: 'Latest browser testing',
                      tooltipText: 'Testing takes place on Chrome, Edge, Firefox and Safari',
                      valueIcon: 'check',
                  },
                  {
                      label: 'Detailed bug reporting',
                      valueIcon: 'check',
                  },
                  {
                      label: 'Expert verification',
                      valueIcon: 'check',
                  },
              ],
          },
      ],
      title: 'Premium',
  },
]

export default BugHuntPricingConfig
