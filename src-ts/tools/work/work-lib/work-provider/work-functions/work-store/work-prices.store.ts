import { WorkPrice } from './work-price.model'
import { WorkPricesType } from './work-prices-type.model'
import { WorkPricesConfig } from './work-prices.config'
import { WorkType } from './work-type.enum'

export const bugHunt: WorkPrice = WorkPricesConfig[WorkType.bugHunt]
export const review: WorkPrice = WorkPricesConfig[WorkType.review]
export const data: WorkPrice = WorkPricesConfig[WorkType.data]
export const design: WorkPrice = WorkPricesConfig[WorkType.design]
export const designLegacy: WorkPrice = WorkPricesConfig[WorkType.designLegacy]
export const findData: WorkPrice = WorkPricesConfig[WorkType.findData]
export const problem: WorkPrice = WorkPricesConfig[WorkType.problem]

export function getPricesConfig(): WorkPricesType {
    return WorkPricesConfig
}
