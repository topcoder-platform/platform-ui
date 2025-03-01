/**
 * Dialog edit user terms.
 */
import { FC, useCallback, useMemo } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import {
    BaseModal,
    Button,
    InputText,
    LoadingSpinner,
    Table,
    TableColumn,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { useManageUserTerms, useManageUserTermsProps } from '../../hooks'
import { FormSearchByKey, UserInfo, UserTerm } from '../../models'
import { Pagination } from '../common/Pagination'
import { formSearchByKeySchema } from '../../utils'

import styles from './DialogEditUserTerms.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    userInfo: UserInfo
}

export const DialogEditUserTerms: FC<Props> = (props: Props) => {
    const { addedInfo, notAddedInfo }: useManageUserTermsProps = useManageUserTerms(props.userInfo)
    const isRemovingBool = useMemo(
        () => _.some(addedInfo.isRemoving, value => value === true),
        [addedInfo.isRemoving],
    )
    const isAddingBool = useMemo(
        () => _.some(notAddedInfo.isAdding, value => value === true),
        [notAddedInfo.isAdding],
    )

    const isAddingOrRemoving = useMemo(
        () => isRemovingBool || isAddingBool,
        [isAddingBool, isRemovingBool],
    )

    const isLoading = useMemo(
        () => addedInfo.isLoadingTerm
            || notAddedInfo.isLoadingTerm
            || isRemovingBool
            || isAddingBool,
        [addedInfo.isLoadingTerm, notAddedInfo.isLoadingTerm, isRemovingBool, isAddingBool],
    )
    const addedInfoDataMapping: { [id: string]: boolean } = useMemo(
        () => _.reduce(
            addedInfo.datas,
            (
                acc: { [id: string]: boolean },
                {
                    id,
                }: {
                    id: string
                },
            ) => ({ ...acc, [id]: true }),
            {},
        ),
        [addedInfo.datas],
    )

    const handleClose = useCallback(() => {
        if (!isLoading) {
            props.setOpen(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading])

    const columnAddedTerms = useMemo<TableColumn<UserTerm>[]>(
        () => [
            {
                className: styles.tableCell,
                label: 'Title',
                propertyName: 'title',
                type: 'text',
            },
            {
                className: styles.blockAction,
                label: 'Action',
                renderer: (data: UserTerm) => (
                    <Button
                        primary
                        variant='danger'
                        label='UnSign'
                        onClick={function onClick() {
                            addedInfo.doRemoveTerm(data.id)
                        }}
                        disabled={isAddingOrRemoving}
                    />
                ),
                type: 'action',
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isAddingOrRemoving, addedInfo.doRemoveTerm],
    )
    const columnNotAddedTerms = useMemo<TableColumn<UserTerm>[]>(
        () => [
            {
                className: styles.tableCell,
                label: 'Title',
                propertyName: 'title',
                type: 'text',
            },
            {
                className: styles.blockAction,
                label: 'Action',
                renderer: (data: UserTerm) => (
                    <>
                        {!addedInfoDataMapping[data.id] && (
                            <Button
                                primary
                                variant='linkblue'
                                label='Sign Terms'
                                onClick={function onClick() {
                                    notAddedInfo.doAddTerm(data.id)
                                }}
                                disabled={isAddingOrRemoving}
                            />
                        )}
                    </>
                ),
                type: 'action',
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isAddingOrRemoving, addedInfoDataMapping, notAddedInfo.doAddTerm],
    )

    const { handleSubmit: handleSubmitAdd, register: registerAdd }: UseFormReturn<FormSearchByKey>
        = useForm({
            defaultValues: {
                searchKey: '',
            },
            mode: 'all',
            resolver: yupResolver(formSearchByKeySchema),
        })

    const onSubmitAdd = useCallback(
        (data: FormSearchByKey) => {
            addedInfo.setSearch(data.searchKey ?? '')
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [addedInfo.setSearch],
    )

    const { handleSubmit: handleSubmitNotAdd, register: registerNotAdd }: UseFormReturn<FormSearchByKey>
        = useForm({
            defaultValues: {
                searchKey: '',
            },
            mode: 'all',
            resolver: yupResolver(formSearchByKeySchema),
        })
    const onSubmitNotAdd = useCallback(
        (data: FormSearchByKey) => {
            notAddedInfo.setSearch(data.searchKey ?? '')
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [notAddedInfo.setSearch],
    )

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            title={`Terms of ${props.userInfo.handle}`}
            onClose={handleClose}
            open={props.open}
            focusTrapped={false}
            classNames={{
                modal: classNames(styles.modal),
            }}
        >
            <div className={classNames(styles.container, props.className)}>
                <div className={styles.blockContent}>
                    <div className={styles.blockContentSection}>
                        <h2 className={styles.textTitle}>Added Terms</h2>
                        <form
                            className={styles.blockFilter}
                            onSubmit={handleSubmitAdd(onSubmitAdd)}
                        >
                            <InputText
                                type='text'
                                name='searchKey'
                                label='Title'
                                placeholder='Title'
                                tabIndex={0}
                                forceUpdateValue
                                onChange={_.noop}
                                classNameWrapper={styles.inputField}
                                inputControl={registerAdd('searchKey')}
                            />
                            <Button
                                primary
                                type='submit'
                                disabled={addedInfo.isLoadingTerm}
                            >
                                Filter
                            </Button>
                        </form>

                        {addedInfo.isLoadingTerm ? (
                            <div className={styles.loadingSpinnerContainer}>
                                <LoadingSpinner className={styles.spinner} />
                            </div>
                        ) : (
                            <>
                                {addedInfo.datas.length > 0 ? (
                                    <>
                                        <Table
                                            columns={columnAddedTerms}
                                            data={addedInfo.datas}
                                            disableSorting
                                            onToggleSort={_.noop}
                                        />
                                        <Pagination
                                            page={addedInfo.page}
                                            totalPages={addedInfo.totalPage}
                                            onPageChange={addedInfo.setPage}
                                            disabled={addedInfo.isLoadingTerm}
                                        />
                                    </>
                                ) : (
                                    <div>No terms</div>
                                )}
                            </>
                        )}
                    </div>
                    <div className={styles.blockContentSection}>
                        <h2 className={styles.textTitle}>Not Added Terms</h2>
                        <form
                            className={styles.blockFilter}
                            onSubmit={handleSubmitNotAdd(onSubmitNotAdd)}
                        >
                            <InputText
                                type='text'
                                name='searchKey'
                                label='Title'
                                placeholder='Title'
                                tabIndex={0}
                                forceUpdateValue
                                onChange={_.noop}
                                classNameWrapper={styles.inputField}
                                inputControl={registerNotAdd('searchKey')}
                            />
                            <Button
                                primary
                                type='submit'
                                disabled={notAddedInfo.isLoadingTerm}
                            >
                                Filter
                            </Button>
                        </form>

                        {notAddedInfo.isLoadingTerm ? (
                            <div className={styles.loadingSpinnerContainer}>
                                <LoadingSpinner className={styles.spinner} />
                            </div>
                        ) : (
                            <>
                                {notAddedInfo.datas.length > 0 ? (
                                    <>
                                        <Table
                                            columns={columnNotAddedTerms}
                                            data={notAddedInfo.datas}
                                            disableSorting
                                            onToggleSort={_.noop}
                                        />
                                        <Pagination
                                            page={notAddedInfo.page}
                                            totalPages={notAddedInfo.totalPage}
                                            onPageChange={notAddedInfo.setPage}
                                            disabled={
                                                notAddedInfo.isLoadingTerm
                                            }
                                        />
                                    </>
                                ) : (
                                    <div>No Available terms</div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <div className={styles.actionButtons}>
                    <Button
                        disabled={isLoading}
                        secondary
                        size='lg'
                        onClick={handleClose}
                    >
                        Close
                    </Button>
                </div>

                {isAddingOrRemoving && (
                    <div className={styles.dialogLoadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
            </div>
        </BaseModal>
    )
}

export default DialogEditUserTerms
