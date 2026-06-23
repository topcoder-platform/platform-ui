import {
    extractTermId,
    replaceTermIdInUrl,
    resolveDocuSignTemplateId,
    resolveStandardTermsConfig,
} from './terms.utils'

describe('engagement terms utils', () => {
    const OLD_TERMS_ID = '317cd8f9-d66c-4f2a-8774-63c612d99cd4'
    const NEW_TERMS_ID = '0a507fb7-3fe0-402b-b121-1a24af4a9cf1'
    const NEW_NDA_TEMPLATE_ID = '400b989d-1c75-4889-b6f6-421e1f924709'
    const TERMS_URL = `https://www.topcoder-dev.com/challenges/terms/detail/${OLD_TERMS_ID}`

    it('extracts the terms id from a terms detail URL', () => {
        expect(extractTermId(TERMS_URL))
            .toBe(OLD_TERMS_ID)
    })

    it('rewrites a terms detail URL with the configured term id', () => {
        expect(replaceTermIdInUrl(TERMS_URL, NEW_TERMS_ID))
            .toBe(`https://www.topcoder-dev.com/challenges/terms/detail/${NEW_TERMS_ID}`)
    })

    it('prefers the configured Standard Terms id over the fallback terms URL id', () => {
        expect(resolveStandardTermsConfig(NEW_TERMS_ID, TERMS_URL))
            .toEqual({
                id: NEW_TERMS_ID,
                url: `https://www.topcoder-dev.com/challenges/terms/detail/${NEW_TERMS_ID}`,
            })
    })

    it('falls back to the terms URL id when no configured Standard Terms id is provided', () => {
        expect(resolveStandardTermsConfig(undefined, TERMS_URL))
            .toEqual({
                id: OLD_TERMS_ID,
                url: TERMS_URL,
            })
    })

    it('prefers the configured DocuSign template for NDA terms', () => {
        expect(resolveDocuSignTemplateId({
            docusignTemplateId: 'old-template-id',
            title: 'Topcoder Member Non-Disclosure Agreement v3.0',
        }, NEW_NDA_TEMPLATE_ID))
            .toBe(NEW_NDA_TEMPLATE_ID)
    })

    it('keeps the Terms API DocuSign template for non-NDA terms', () => {
        expect(resolveDocuSignTemplateId({
            docusignTemplateId: 'assignment-template-id',
            title: 'Assignment Terms',
        }, NEW_NDA_TEMPLATE_ID))
            .toBe('assignment-template-id')
    })
})
