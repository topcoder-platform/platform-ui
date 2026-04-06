import { taasProjectSchema } from './taas-project.schema'

describe('taas-project schema select validation', () => {
    const baseFormData = {
        jobs: [
            {
                description: 'Support the customer with platform operations.',
                duration: 4,
                people: 1,
                role: {
                    label: 'Developer',
                    value: 'developer',
                },
                skills: [
                    {
                        name: 'Nagios',
                        skillId: 'nagios',
                    },
                ],
                title: 'Operations Engineer',
                workLoad: {
                    label: 'Full-time',
                    value: 'full_time',
                },
            },
        ],
        name: 'TaaS project',
    }

    it('reports the role field when the role select is left empty', async () => {
        await expect(
            taasProjectSchema.validate({
                ...baseFormData,
                jobs: [
                    {
                        ...baseFormData.jobs[0],
                        role: {
                            label: '',
                            value: '',
                        },
                    },
                ],
            }),
        )
            .rejects
            .toMatchObject({
                message: 'Please choose role',
                path: 'jobs[0].role',
            })
    })

    it('reports the workload field when the workload select is left empty', async () => {
        await expect(
            taasProjectSchema.validate({
                ...baseFormData,
                jobs: [
                    {
                        ...baseFormData.jobs[0],
                        workLoad: {
                            label: '',
                            value: '',
                        },
                    },
                ],
            }),
        )
            .rejects
            .toMatchObject({
                message: 'Please choose workload',
                path: 'jobs[0].workLoad',
            })
    })
})
