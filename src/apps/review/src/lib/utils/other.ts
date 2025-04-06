/**
 * Format number to ordinals.
 * @param placement placement
 * @returns ordinal string
 */
export function formatOrdinals(placement: number | string): string {
    let ord = ''
    switch (placement) {
        case 1:
            ord = '1st'
            break
        case 2:
            ord = '2nd'
            break
        case 3:
            ord = '3rd'
            break
        case '1':
            ord = '1st'
            break
        case '2':
            ord = '2nd'
            break
        case '3':
            ord = '3rd'
            break
        default:
            ord = `${placement}th`
    }

    return ord
}
