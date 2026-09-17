import { isTaskChallenge } from './challenge-type.utils'

describe('challenge type utilities', () => {
    it('identifies canonical and legacy Task challenge shapes', () => {
        expect(isTaskChallenge({ id: 'catalog-object', name: 'Task', type: { name: 'Task' } }))
            .toBe(true)
        expect(isTaskChallenge({ id: 'catalog-string', name: 'Task', type: 'TASK' }))
            .toBe(true)
        expect(isTaskChallenge({ id: 'task-flag', name: 'Task', task: { isTask: true } }))
            .toBe(true)
        expect(isTaskChallenge({ id: 'flat-task-flag', name: 'Task', taskIsTask: true }))
            .toBe(true)
        expect(isTaskChallenge({ id: 'legacy-flag', legacy: { pureV5Task: true }, name: 'Task' }))
            .toBe(true)
        expect(isTaskChallenge({
            id: 'nested-flag-precedence',
            name: 'Challenge',
            task: { isTask: false },
            taskIsTask: true,
        }))
            .toBe(false)
        expect(isTaskChallenge({ id: 'challenge', name: 'Challenge', type: { name: 'Challenge' } }))
            .toBe(false)
        expect(isTaskChallenge())
            .toBe(false)
    })
})
