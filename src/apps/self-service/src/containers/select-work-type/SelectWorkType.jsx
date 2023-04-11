import { useNavigate } from "react-router-dom";
import classNames from "classnames";

import React, { useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";

import { Breadcrumb, ContactSupportModal, LoadingSpinner } from "~/libs/ui";

import { triggerAutoSave } from "../../actions/autoSave";
import { saveWorkType, toggleSupportModal } from "../../actions/form";
import { setProgressItem } from "../../actions/progress";
import { Button, BUTTON_SIZE } from "../../components/button";
import { WorkTypeConfigs } from "../../lib";
import { ROUTES, projectAndProfessionalWork, webWorkTypes, workTypes } from "../../config";
import { PageContent, PageDivider, PageH2 } from "../../components/page-elements";
import Slider from "../../components/Slider";

import styles from "./SelectWorkType.module.scss";

const WorkTypeCard = ({
  className = "",
  title,
  subHeading,
  subHeadingMobile,
  bgImage,
  ctaButtonOnClick,
  content,
}) => {
  return (
    <div
      className={classNames(styles.workTypeCard, styles.workTypeCardSmall, className)}
      style={{ backgroundImage: `url(${bgImage})` }}
      onClick={ctaButtonOnClick}
    >
      <div className={styles.workTypeCardContentContainer}>
        <p
          className={`${styles.workTypeCardSubHeading} ${styles.hideOnMobile}`}
        >
          {subHeading}
        </p>
        <p
          className={`${styles.workTypeCardSubHeading} ${styles.hideOnDesktop}`}
        >
          {subHeadingMobile || subHeading}
        </p>

        <h2 className={styles.workTypeCardHeading}>{title}</h2>

        <p className={`${styles.workTypeCardContent} ${styles.hideOnMobile}`}>
          {content}
        </p>
        <p className={`${styles.workTypeCardContent} ${styles.hideOnDesktop}`}>
          {content}
        </p>
      </div>

      {!!ctaButtonOnClick && (
        <Button
          size={BUTTON_SIZE.MEDIUM}
          type="secondary"
          className={styles.workTypeCardCtaButton}
        >
          learn more
        </Button>
      )}
    </div>
  );
};

const WorkTypeCardWide = ({
  className = "",
  bgImage = "",
  title,
  content,
  ctaText = "",
  icon = "",
  svgIcon: SvgIcon = "",
  ctaButtonOnClick,
}) => {

  return (
    <div
      className={classNames(styles.workTypeCard, styles.workTypeCardWide, className)}
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {!!SvgIcon ? <SvgIcon /> : !!icon && <img src={icon} alt="" />}
      <div className={styles.workTypeCardContentContainer}>
        <h2 className={styles.workTypeCardHeading}>{title}</h2>
        <p className={styles.workTypeCardSubHeading}>{content}</p>

        {!!ctaText && !!ctaButtonOnClick && (
          <Button
            onClick={ctaButtonOnClick}
            size={BUTTON_SIZE.MEDIUM}
            type="secondary"
            className={styles.workTypeCardCtaButton}
          >
            {ctaText}
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Select Work Type Page
 */
const SelectWorkType = ({
  saveWorkType,
  setProgressItem,
  toggleSupportModal,
  isLoggedIn,
}) => {

  const dispatch = useDispatch();
  const [isLoading] = useState(false);
  const showSupportModal = useSelector((state) => state.form.showSupportModal);
  const challenge = useSelector((state) => state.challenge);
  const navigate = useNavigate()

  const allWorkTypes = [...workTypes, ...webWorkTypes, ...Object.values(WorkTypeConfigs)];
  const featuredWorkTypes = allWorkTypes.filter((wt) => wt.featured);

  useEffect(() => {
    return () => {
      dispatch(triggerAutoSave(true, isLoggedIn));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = (selectedItem = webWorkTypes[0]) => {
    saveWorkType({
      selectedWorkType: selectedItem.type || selectedItem.title,
      selectedWorkTypeDetail: selectedItem.title,
    });
    setProgressItem(2);
    navigate(selectedItem.startRoute);
    dispatch(triggerAutoSave(true, isLoggedIn));
  };

  const onShowSupportModal = () => {
    toggleSupportModal(true);
  };
  const onHideSupportModal = () => {
    toggleSupportModal(false);
  };

  const breadcrumb = [
    { url: ROUTES.DASHBOARD_PAGE, name: "My work" },
    { url: "/self-service/wizard", name: "Start work" },
  ];

  const workTypeClassName = (title) => title.toLowerCase().split(" ").join("-");

  return (
    <>
      <LoadingSpinner hide={!isLoading} />
      <ContactSupportModal
        workId={challenge?.id}
        isOpen={showSupportModal}
        isSelfService={true}
        onClose={onHideSupportModal}
      />
      <Breadcrumb items={breadcrumb} />
      <PageContent className={styles["pageContent"]}>
        <PageH2 className={styles.pageHeading}>Start work</PageH2>

        <PageDivider />

        <Slider className={styles.workTypeSlider}>
          {featuredWorkTypes.map((featuredWorkType) => (
            <WorkTypeCard
              title={featuredWorkType.title}
              subHeading={featuredWorkType.shortDescription}
              subHeadingMobile={featuredWorkType.shortDescriptionMobile}
              className={`${styles.heroBackgroundContainer} ${styles[workTypeClassName(featuredWorkType.title)]}`}
              bgImage={featuredWorkType.bgImage}
              ctaButtonOnClick={() => handleClick(featuredWorkType)}
              content={featuredWorkType.description}
              key={featuredWorkType.title}
            />
          ))}
        </Slider>

        <WorkTypeCardWide
          title={projectAndProfessionalWork.title}
          content={projectAndProfessionalWork.shortDescription}
          ctaText={projectAndProfessionalWork.ctaText}
          bgImage={projectAndProfessionalWork.bgImage}
          svgIcon={projectAndProfessionalWork.svgIcon}
          ctaButtonOnClick={onShowSupportModal}
        />
      </PageContent>
    </>
  );
};

const mapStateToProps = ({ form }) => form;

const mapDispatchToProps = {
  saveWorkType,
  setProgressItem,
  toggleSupportModal,
};

export default connect(mapStateToProps, mapDispatchToProps)(SelectWorkType);
