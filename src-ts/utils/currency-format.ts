export default function currencyFormat(num: number): string {
    return '$' + num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}
