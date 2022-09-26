export interface LearnConfigModel {
    API: string
    CERT_DOMAIN: string
    CERT_ELEMENT_SELECTOR: {
        attribute: string,
        value: string,
    }
    CLIENT: string
}
