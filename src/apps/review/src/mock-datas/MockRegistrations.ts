/**
 * Mock data for the registration
 */

import { RegistrationInfo } from '../lib/models'

export const MockRegistrations: RegistrationInfo[] = [
    {
        handle: 'Gando19850304',
        handleColor: '#616BD5',
        id: '1',
        rating: 1000,
        registrationDate: new Date()
            .toISOString(),
    },
    {
        handle: 'shubhangi18',
        handleColor: '#0A0A0A',
        id: '2',
        rating: undefined,
        registrationDate: new Date()
            .toISOString(),
    },
    {
        handle: 'stevenfrog',
        handleColor: '#2D7E2D',
        id: '2',
        rating: 600,
        registrationDate: new Date()
            .toISOString(),
    },
    {
        handle: 'nitheeshach_1',
        handleColor: '#EF3A3A',
        id: '4',
        rating: 2100,
        registrationDate: new Date()
            .toISOString(),
    },
]
