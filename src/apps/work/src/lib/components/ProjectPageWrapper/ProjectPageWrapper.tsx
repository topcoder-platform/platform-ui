import { FC, PropsWithChildren, ReactNode, useContext } from 'react'
import { Link } from 'react-router-dom'

import { IconOutline } from '~/libs/ui'
import { PageWrapper, PageWrapperProps } from '~/apps/review/src/lib'

import { useFetchProject } from '../../hooks'
import { ProjectListTabs } from '../ProjectListTabs'
import { ProjectBillingAccountExpiredNotice } from '../ProjectBillingAccountExpiredNotice'
import { WorkAppContextModel } from '../../models'
import { WorkAppContext } from '../../contexts'
import { checkCanEditProjectDetails, checkCanManageProject } from '../../utils'

import styles from './ProjectPageWrapper.module.scss'

export interface ProjectPageWrapperProps extends PageWrapperProps {
    projectId: string | undefined
    headerActions?: ReactNode
}

export const ProjectPageWrapper: FC<PropsWithChildren<ProjectPageWrapperProps>> = props => {
    const workAppContext: WorkAppContextModel = useContext(WorkAppContext)
    // const currentUserId = workAppContext.loginUserInfo?.userId === undefined
    //     || workAppContext.loginUserInfo?.userId === null
    //     ? undefined
    //     : String(workAppContext.loginUserInfo.userId)
    // const currentUserHandle = toOptionalString(workAppContext.loginUserInfo?.handle)
    const projectResult = useFetchProject(props.projectId || undefined)
    const canManageProject = !!projectResult.project
            && checkCanManageProject(
                workAppContext.userRoles,
                workAppContext.loginUserInfo?.userId,
                projectResult.project,
            )
    const canEditProjectDetails = !!projectResult.project
            && checkCanEditProjectDetails(
                workAppContext.userRoles,
                workAppContext.loginUserInfo?.userId,
                projectResult.project,
            )

    const pageTitle = projectResult.project?.name
        ? projectResult.project.name
        : props.pageTitle

    const projectTabs = props.projectId
        ? <ProjectListTabs projectId={props.projectId} />
        : undefined

    const billingAccountExpiredNotice = props.projectId
        ? (
            <ProjectBillingAccountExpiredNotice
                billingAccountId={projectResult.project?.billingAccountId}
                billingAccountName={projectResult.project?.billingAccountName}
                canManageProject={canManageProject}
                displayMemberPaymentDetailsToCopilots={
                    projectResult.project?.details?.displayMemberPaymentDetailsToCopilots
                }
                projectId={props.projectId}
            />
        )
        : undefined
    const titleAction = props.projectId
        ? (
            <div className={styles.projectTitleActions}>
                {canEditProjectDetails
                    ? (
                        <Link
                            aria-label='Edit project'
                            className={styles.projectEditLink}
                            to={`/projects/${props.projectId}/edit`}
                        >
                            <IconOutline.PencilIcon className={styles.projectEditIcon} />
                        </Link>
                    )
                    : undefined}
            </div>
        )
        : undefined

    return (
        <PageWrapper
            {...props}
            pageTitle={pageTitle}
            breadCrumb={props.breadCrumb}
            titleAction={titleAction}
        >
            {billingAccountExpiredNotice}
            {projectTabs}

            <div className={styles.container}>
                <div className={styles.headerRow}>
                    <h4 className={styles.sectionTitle}>{props.pageTitle}</h4>

                    {props.headerActions && (
                        <div className={styles.headerActions}>
                            {props.headerActions}
                        </div>
                    )}
                </div>
            </div>

            {props.children}
        </PageWrapper>
    )
}
