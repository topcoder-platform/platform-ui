import moment from 'moment'
import { MockScreening } from '../../mock-datas/MockScreening'
import { Screening } from '../models'
import { TABLE_DATE_FORMAT } from '../../config/index.config'

export const fetchScreenings = async (): Promise<Screening[]> =>
    Promise.resolve(
        MockScreening.map((screening) => ({
            ...screening,
            createdAtString: screening.createdAt
                ? moment(screening.createdAt).local().format(TABLE_DATE_FORMAT)
                : screening.createdAt,
        }))
    )
