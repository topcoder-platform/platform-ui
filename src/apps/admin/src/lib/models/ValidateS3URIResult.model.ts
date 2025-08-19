/**
 * Validate s3 url result
 */
export interface ValidateS3URIResult {
    isValid: boolean
    bucket?: string
    key?: string
}
