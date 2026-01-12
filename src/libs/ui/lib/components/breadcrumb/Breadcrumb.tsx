import { ReactElement, ReactPortal } from 'react'
import { createPortal } from 'react-dom'

import { PageSubheaderPortalId } from '~/config'

import { BreadcrumbItem, BreadcrumbItemModel } from './breadcrumb-item'
import styles from './Breadcrumb.module.scss'

interface BreadcrumbProps {
    items: Array<BreadcrumbItemModel>
    renderInline?: boolean
}

const Breadcrumb = (props: BreadcrumbProps): ReactElement | ReactPortal => {
    const usePortal: boolean = !props.renderInline

    function renderBreadcrumbs(): ReactElement {
        return (
            <div className={styles['breadcrumb-wrap']}>
                <nav className={styles.breadcrumb}>
                    <ol className='desktop-hide'>
                        <>
                            {
                                props.items.length <= 2 && props.items.map((item, index) => (
                                    <BreadcrumbItem
                                        index={index + 1}
                                        item={item}
                                        // eslint-disable-next-line react/no-array-index-key
                                        key={index}
                                    />
                                ))
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
                        {props.items.map((item, index) => (
                            <BreadcrumbItem
                                index={index + 1}
                                item={item}
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                            />
                        ))}
                    </ol>
                </nav>
            </div>
        )
    }

    if (usePortal) {
        const portalRootEl: HTMLElement | null = document.getElementById(PageSubheaderPortalId)

        if (portalRootEl) {
            return createPortal(
                renderBreadcrumbs(),
                portalRootEl,
            )
        }

        return <></>
    }

    return renderBreadcrumbs()
}

export default Breadcrumb
