import { getReactEnv } from './react-env'

const originalEnv = process.env

describe('getReactEnv', () => {
    beforeEach(() => {
        process.env = { ...originalEnv }
        delete process.env.REACT_APP_FILESTACK_REGION
        delete process.env.REACT_APP_FEATURE_FLAG
        delete process.env.REACT_APP_RETRY_COUNT
    })

    afterAll(() => {
        process.env = originalEnv
    })

    it('uses the provided default when an env value is blank', () => {
        process.env.REACT_APP_FILESTACK_REGION = ''

        expect(getReactEnv<string>('FILESTACK_REGION', 'us-east-1'))
            .toBe('us-east-1')
    })

    it('keeps parsing boolean and numeric env values', () => {
        process.env.REACT_APP_FEATURE_FLAG = 'true'
        process.env.REACT_APP_RETRY_COUNT = '2'

        expect(getReactEnv<boolean>('FEATURE_FLAG', false))
            .toBe(true)
        expect(getReactEnv<number>('RETRY_COUNT', 0))
            .toBe(2)
    })
})
