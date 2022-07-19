import { FC } from 'react'
import { createPortal } from 'react-dom'

import { BreadcrumbItem, BreadcrumbItemModel } from './breadcrumb-item'
import styles from './Breadcrumb.module.scss'

interface BreadcrumbProps {
    items: Array<BreadcrumbItemModel>
}

const Breadcrumb: FC<BreadcrumbProps> = (props: BreadcrumbProps) => {
    const portalRootEl: HTMLElement|null = document.getElementById('page-subheader-portal-el')

    if (!portalRootEl) {
        return <></>
    }

    return createPortal((
        <div className={styles['breadcrumb-wrap']}>
            <nav className={styles.breadcrumb}>
                <ol className='desktop-hide'>
                    <>
                        {
                            props.items.length <= 2 && props.items.map((item, index) =>
                                <BreadcrumbItem
                                    index={index + 1}
                                    item={item}
                                    key={index}
                                />
                            )
                        }

                        {
                            props.items.length > 2 && (
                                <>
                                    <BreadcrumbItem
                                        index={0}
                                        item={{
                                            ...props.items[props.items.length - 2],
                                            isElipsis: true,
                                            name: '...',
                                            url: props.items[props.items.length - 2].url,
                                        }}
                                    />
                                    <BreadcrumbItem
                                        index={1}
                                        item={{
                                            ...props.items[props.items.length - 1],
                                            name: props.items[props.items.length - 1].name,
                                            url: props.items[props.items.length - 1].url,
                                        }}
                                    />
                                </>
                            )
                        }
                    </>
                </ol>
                <ol className='mobile-hide'>
                    {props.items.map((item, index) =>
                        <BreadcrumbItem
                            index={index + 1}
                            item={item}
                            key={index}
                        />
                    )}
                </ol>
            </nav>
        </div>
    ), portalRootEl)
}

export default Breadcrumb
