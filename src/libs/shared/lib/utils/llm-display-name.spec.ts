import { getLlmDisplayName } from './llm-display-name'

describe('getLlmDisplayName', () => {
    it('prefers the display name', () => {
        expect(getLlmDisplayName({
            displayName: 'Claude Haiku 5.5',
            name: 'arn:aws:bedrock:us-east-1:123456789012:application-inference-profile/abc123',
        }))
            .toBe('Claude Haiku 5.5')
    })

    it('falls back to the model id', () => {
        // eslint-disable-next-line unicorn/no-null -- the API returns null for an unset displayName
        expect(getLlmDisplayName({ displayName: null, name: 'us.anthropic.claude-sonnet-4-6' }))
            .toBe('us.anthropic.claude-sonnet-4-6')
        expect(getLlmDisplayName({ displayName: '  ', name: 'qwen3:latest' }))
            .toBe('qwen3:latest')
    })

    it('never returns an ARN', () => {
        expect(getLlmDisplayName({
            name: 'arn:aws:bedrock:us-east-1:123456789012:application-inference-profile/abc123',
        }))
            .toBe('')
    })

    it('handles a missing LLM', () => {
        expect(getLlmDisplayName(undefined))
            .toBe('')
        // eslint-disable-next-line unicorn/no-null
        expect(getLlmDisplayName(null))
            .toBe('')
    })
})
