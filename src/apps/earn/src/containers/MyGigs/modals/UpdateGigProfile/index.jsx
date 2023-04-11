import React, { useEffect, useMemo, useState, useRef } from "react";
import { connect } from "react-redux";
import PT from "prop-types";
import GigsButton from "../../../../components/GigsButton";
import FilePicker from "../../../../components/my-gigs/FilePicker";
import TextInput from "../../../../components/TextInput";
import Dropdown from "../../../../components/Dropdown";
import UserPhoto from "../../../../components/my-gigs/UserPhoto";
import { ReactComponent as IconClose } from "../../../../assets/icons/close.svg";
import { ReactComponent as IconInfo } from "../../../../assets/icons/info.svg";
import StatusTooltip from "./tooltips/StatusTooltip";
import actions from "../../../../actions";
import _, { size, values } from "lodash";

import { GIG_STATUS } from "../../../../constants";
import config from "../../../../config";
import * as utils from "../../../../utils";
import { makeProfileUrl } from "../../../../utils/url";

import styles from "./styles.scss";

const UpdateGigProfile = ({
  profile,
  onSubmit,
  onClose,
  countries,
  getAllCountries,
}) => {
  const statuses = values(GIG_STATUS);
  const countryOptions = useMemo(() => {
    const selectedCountry = countries.find(
      (country) => country.countryCode === profile.country
    );
    return utils.createDropdownOptions(
      countries.map((country) => country.name),
      selectedCountry
    );
  }, [profile, countries]);

  const [profileEdit, setProfileEdit] = useState(
    profile ? _.clone(profile) : null
  );

  const statusOptions = useMemo(() => {
    const selected = profileEdit.status;
    const options = statuses.filter((s) => s !== GIG_STATUS.PLACED);
    return utils.createDropdownOptions(options, selected);
  }, [profileEdit, statuses]);

  const [validation, setValidation] = useState(null);
  const [pristine, setPristine] = useState(true);

  // only fetch countries when they don't exist in redux store.
  useEffect(() => {
    if (size(countries) === 0) getAllCountries();
  }, [countries, getAllCountries]);

  useEffect(() => {
    setProfileEdit(_.clone(profile));
  }, [profile]);

  useEffect(() => {
    let validation = null;
    let error;

    if (profileEdit == null) {
      return;
    }

    if (!profileEdit.status) {
      validation = validation || {};
      validation.status = "Please, select your status";
    }

    if (profileEdit.fileError) {
      validation = validation || {};
      validation.file = profileEdit.fileError;
    }

    // if (!profileEdit.file) {
    //   validation = validation || {};
    //   validation.file = "Please, pick your CV file for uploading";
    // }

    if ((error = utils.myGig.validateCity(profileEdit.city))) {
      validation = validation || {};
      validation.city = error;
    }

    if (!profileEdit.country) {
      validation = validation || {};
      validation.country = "Please, select your country";
    }

    if (
      (error = utils.myGig.validatePhone(
        profileEdit.phone,
        profileEdit.country
      ))
    ) {
      validation = validation || {};
      validation.phone = error;
    }

    setValidation(validation);
  }, [profileEdit]);

  const submitEnabled =
    validation === null &&
    !profileEdit.fileError &&
    (profile.city !== profileEdit.city ||
      profile.country !== profileEdit.country ||
      profile.phone !== profileEdit.phone ||
      profile.status !== profileEdit.status ||
      profile.file !== profileEdit.file);

  const varsRef = useRef();
  varsRef.current = { profileEdit, validation };

  const onSubmitProfile = () => {
    const update = varsRef.current.profileEdit;
    if (!update.countryName) {
      const selectedCountry = countries.find(
        (country) => country.countryCode === update.country
      );
      update.countryName = selectedCountry.name;
    }
    delete update.fileError;
    onSubmit(update);
  };

  const handleStatusDropdownChange = (newOptions) => {
    const selectedOption = utils.getSelectedDropdownOption(newOptions);
    setProfileEdit({
      ...varsRef.current.profileEdit,
      status: selectedOption.label,
    });
    setPristine(false);
  };

  const handleFilePick = (file, error) => {
    if (error) {
      setProfileEdit({
        ...varsRef.current.profileEdit,
        file,
        fileError: error,
        uploadTime: null,
      });
    } else {
      setProfileEdit({
        ...varsRef.current.profileEdit,
        file,
        fileError: null,
        uploadTime: null,
      });
    }
    setPristine(false);
  };

  const handleCountryDropdownChange = (newOptions) => {
    const selectedOption = utils.getSelectedDropdownOption(newOptions);
    const country = countries.find(
      (country) => selectedOption.label === country.name
    );
    setProfileEdit({
      ...varsRef.current.profileEdit,
      country: country.countryCode,
      countryName: country.name,
    });
    setPristine(false);
  };
  /**
   * Generic handler for inputs to update the correct value
   * @param {string} field
   * @returns
   */
  const handleInputChange = (field) => (value) => {
    setProfileEdit({ ...varsRef.current.profileEdit, [field]: value });
    setPristine(false);
  };

  return (
    <div className={styles["update-resume"]}>
      <button className={styles["close"]} onClick={onClose}>
        <IconClose />
      </button>
      <h4 className={styles["title"]}>UPDATE RESUME</h4>
      <p className={[styles["text"], styles["warnings"]].join(" ")}>
        Uploading a resume will change your resume for all jobs that you apply
        to.
      </p>
      <div className={styles["profile"]}>
        <div className={styles["member"]}>
          <div className={styles["photo"]}>
            <UserPhoto handle={profile.handle} photoURL={profile.photoURL} />
          </div>
          <div className={styles["handle"]}>
            <a href={`${makeProfileUrl(profile.handle)}`}>{profile.handle}</a>
          </div>
          <div className={styles["name"]}>
            {profile.firstName} {profile.lastName}
          </div>
          <div className={styles["email"]}>{profile.email}</div>
          <div className={styles["status"]}>
            <div className={styles["dropdown"]}>
              <Dropdown
                options={statusOptions}
                size="xs"
                onChange={handleStatusDropdownChange}
                errorMsg={(!pristine && validation && validation.status) || ""}
              />
            </div>
            <StatusTooltip statuses={statuses}>
              <IconInfo />
            </StatusTooltip>
          </div>
        </div>
        <div className={styles["details"]}>
          {profile && profile.existingResume && (
            <div className={styles["resume-details"]}>
              Please upload your resume/CV. Double-check that all of your tech
              skills are listed in your resume/CV.&nbsp;&nbsp;&nbsp;
              <a href={profile.existingResume.file_link} target="_blank">
                {profile.existingResume.filename}
              </a>
            </div>
          )}
          <div className={styles["resume"]}>
            <FilePicker
              label="Drag & drop your resume or CV here - Please Omit Contact Information"
              required
              file={profileEdit.file}
              uploadTime={profileEdit.uploadTime}
              accept=".pdf, .docx"
              errorMsg={(!pristine && validation && validation.file) || ""}
              onFilePick={handleFilePick}
            />
          </div>
          <div className={styles["city"]}>
            <TextInput
              value={profileEdit.city}
              label="City"
              required
              onChange={handleInputChange("city")}
              errorMsg={(!pristine && validation && validation.city) || ""}
            />
          </div>
          <div className={styles["country"]}>
            <Dropdown
              options={countryOptions}
              label="Country"
              required
              onChange={handleCountryDropdownChange}
              errorMsg={(!pristine && validation && validation.country) || ""}
            />
          </div>
          <div className={styles["phone"]}>
            <TextInput
              value={profileEdit.phone}
              label="Phone - Please have the Country Code Included"
              required
              onChange={handleInputChange("phone")}
              errorMsg={(!pristine && validation && validation.phone) || ""}
            />
          </div>
        </div>
      </div>
      <div className={styles["footer"]}>
        <a
          href={`${config.URL.BASE}/settings/profile#skills`}
          className={styles["link"]}
        >
          Update your skills from Topcoder Profile page
        </a>
        <GigsButton
          isPrimary
          size="lg"
          disabled={!submitEnabled}
          onClick={onSubmitProfile}
        >
          UPDATE PROFILE
        </GigsButton>
      </div>
    </div>
  );
};

UpdateGigProfile.propTypes = {
  profile: PT.shape(),
  onSubmit: PT.func,
  onClose: PT.func,
};

const mapStateToProps = (state) => ({
  countries: state.lookup.countries,
});

const mergeProps = (stateProps, dispatchProps, ownProps) => ({
  ...ownProps,
  ...stateProps,
  ...dispatchProps,
});

const mapDispatchToProps = {
  getAllCountries: actions.lookup.getAllCountries,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(UpdateGigProfile);
