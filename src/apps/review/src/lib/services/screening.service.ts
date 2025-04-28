// External imports
import moment from 'moment'

// Internal imports
import { TABLE_DATE_FORMAT } from '../../config/index.config'
import { MockScreening } from '../../mock-datas/MockScreening'
import { Screening } from '../models'

export const fetchScreenings = async (): Promise<Screening[]> => Promise.resolve(
    MockScreening.map(screening => ({
        ...screening,
        createdAtString: screening.createdAt
            ? moment(screening.createdAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : screening.createdAt,
    })),
)
