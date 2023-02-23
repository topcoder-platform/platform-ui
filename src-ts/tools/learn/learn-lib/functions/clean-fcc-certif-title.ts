/**
 * Removes the "certification" at the end of an FCC certificaiton's title
 */
export const clearFCCCertificationTitle: (title: string) => string = (title: string): string => (
    title.replace(/\s*Certification\s*$/i, '')
)
