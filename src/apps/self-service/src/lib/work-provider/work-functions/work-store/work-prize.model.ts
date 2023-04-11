export interface WorkPrize {
    description: string,
    prizes: Array<{
        type: string,
        value: number,
    }>,
    type: string,
}
