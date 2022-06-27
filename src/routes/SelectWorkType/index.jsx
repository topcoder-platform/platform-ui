import { navigate } from "@reach/router";

import React, { useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";

import { triggerAutoSave } from "../../actions/autoSave";
import { saveWorkType, toggleSupportModal } from "../../actions/form";
import { setProgressItem } from "../../actions/progress";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import Page from "../../components/Page";
import PageContent from "../../components/PageContent";
import PageDivider from "../../components/PageDivider";
import PageH2 from "../../components/PageElements/PageH2";
import Slider from "../../components/Slider";
import { Breadcrumb, ContactSupportModal } from "../../../src-ts";
import {
  BUTTON_SIZE,
  projectAndProfessionalWork,
  ROUTES,
  webWorkTypes,
  workTypes,
} from "../../constants/";

import styles from "./styles.module.scss";

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
      className={`${styles.workTypeCard} ${styles.workTypeCardSmall}${
        className ? ` ${className}` : ""
      }`}
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
      className={`${styles.workTypeCard} ${styles.workTypeCardWide}${
        className ? ` ${className}` : ""
      }`}
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
}) => {
  const dispatch = useDispatch();
  const [isLoading, setLoading] = useState(false);
  const showSupportModal = useSelector((state) => state.form.showSupportModal);
  const challenge = useSelector((state) => state.challenge);

  const allWorkTypes = [...workTypes, ...webWorkTypes];
  const featuredWorkTypes = allWorkTypes.filter((wt) => wt.featured);

  useEffect(() => {
    return () => {
      dispatch(triggerAutoSave(true));
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
    dispatch(triggerAutoSave(true));
  };

  const onBack = () => {
    navigate(`/self-service`);
    setProgressItem(1);
    saveWorkType({ workTypeStep: 0 });
    dispatch(triggerAutoSave(true));
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
      <LoadingSpinner show={isLoading} />
      <ContactSupportModal
        workId={challenge?.id}
        isOpen={showSupportModal}
        onClose={onHideSupportModal}
      />
      <Breadcrumb items={breadcrumb} />
      <Page>
        <PageContent className={styles.pageContent}>
          <PageH2 className={styles.pageHeading}>Start work</PageH2>

          <PageDivider />

          <Slider className={styles.workTypeSlider}>
            {featuredWorkTypes.map((featuredWorkType) => (
              <WorkTypeCard
                title={featuredWorkType.title}
                subHeading={featuredWorkType.shortDescription}
                subHeadingMobile={featuredWorkType.shortDescriptionMobile}
                className={`${styles.heroBackgroundContainer} ${
                  styles[workTypeClassName(featuredWorkType.title)]
                }`}
                bgImage={featuredWorkType.bgImage}
                ctaButtonOnClick={() => handleClick(featuredWorkType)}
                content={featuredWorkType.description}
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
      </Page>
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
