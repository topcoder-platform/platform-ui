export const validatePhonenumber: (phone: string) => boolean = (phone: string) => {
    if (!phone) {
        return true
    }

    if (/[- +()0-9]+/.test(phone)) {
        return true
    }

    return false
}
