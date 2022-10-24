const BugHuntPricingConfig = [
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
                      icon: 'user-group',
                      label: 'Device Types',
                      text: 'Desktop',
                      infoIcon: true
                  },
                  {
                      label: 'Latest browser testing',
                      infoIcon: true,
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
          }
      ],
      title: 'Standard',
  },
  {
      id: 'advanced',
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
                      icon: 'user-group',
                      label: 'Device Types',
                      text: 'Desktop & Mobile',
                  },
                  {
                      label: 'Latest browser testing',
                      valueIcon: 'check'
                  },
                  {
                      label: 'Detailed bug reporting',
                      valueIcon: 'check'
                  },
                  {
                      label: 'Expert verification',
                      valueIcon: 'check'
                  },
              ],
          }
      ],
      title: 'Advanced',
      mostPopular: true
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
                      icon: 'user-group',
                      label: 'Device Types',
                      text: 'Desktop, Tablet & Mobile',
                  },
                  {
                      label: 'Latest browser testing',
                      valueIcon: 'check'
                  },
                  {
                      label: 'Detailed bug reporting',
                      valueIcon: 'check'
                  },
                  {
                      label: 'Expert verification',
                      valueIcon: 'check'
                  },
              ],
          }
      ],
      title: 'Premium',
  },
]

export default BugHuntPricingConfig
