import { FC } from 'react'

import { ContentLayout } from '../../lib'

import styles from './SelfService.module.scss'

export const toolTitle: string = 'Self Service'

const SelfService: FC<{}> = () => {

    return (
        <ContentLayout classNames={styles['self-service']} title={toolTitle}>
            <table>
                <colgroup>
                    <col className="self-service-icon" />
                    <col className="self-service-title" />
                    <col className="self-service-status" />
                    <col className="self-service-type" />
                    <col className="self-service-created" />
                    <col className="self-service-solutions" />
                    <col className="self-service-cost" />
                    <col className="self-service-messages" />
                    <col className="self-service-delete" />
                </colgroup>
                <tr>
                    <td>
                    </td>
                    <td>
                        <div className="self-service-cell-title-inner">
                            <div className="self-service-title">Dog Walking Service Website Development</div>
                            <br/>
                            <div className="self-service-description">
                                A dog walking website that allows visitors to select dog walkers and
                                schedule dog walking appointments
                            </div>
                        </div>
                    </td>
                    <td>
                        <div className="self-service-status-chip">
                            <div className="self-service-status-text">
                                DRAFT
                            </div>
                        </div>
                    </td>
                    <td>
                        <div className="self-service-type-text">
                            Website Development
                        </div>
                    </td>
                    <td>
                        <div className="self-service-created-text">April 8, 2022</div>
                    </td>
                    <td>
                        <div className="self-service-solutions-text">April 28, 2022</div>
                    </td>
                    <td>
                        <div className="self-service-cost-text">$12,000</div>
                    </td>
                    <td>
                        <div className="self-service-messages-chip">
                            <div className="self-service-messages-text">
                                3
                            </div>
                        </div>
                    </td>
                    <td>
                        <img/>
                    </td>
                </tr>
            </table>
        </ContentLayout>
    )
}

//<ContentLayout classNames={styles['self-service']} title={toolTitle} />

export default SelfService
