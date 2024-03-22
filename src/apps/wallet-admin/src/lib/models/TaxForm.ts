export interface TaxForm {
    id: string;
    taxFormId: string;
    dateFiled: string;
    userId: string;
    handle?: string;
    taxForm: {
        taxFormId: string;
        name: string;
    }
    status: string;
}
