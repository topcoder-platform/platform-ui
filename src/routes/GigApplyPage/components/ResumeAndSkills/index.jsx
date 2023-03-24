import styles from "./styles.scss";
import formStyles from "../ApplicationForm/styles.scss";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import debounce from "lodash/debounce";
import ResumeFilePicker from "../ResumeFilePicker";
import MultiSelect from "components/MultiSelect";
import * as myGigsSelectors from "reducers/myGigsSelectors";
import * as gigsSelectors from "reducers/gigs/selectors";
import * as applySelectors from "reducers/gigApply/selectors";
import applyActions from "actions/gigApply/creators";
import { useUpdateEffect } from "utils/hooks/useUpdateEffect";
import { DEBOUNCE_ON_CHANGE_TIME } from "constants";

const ResumeAndSkills = () => {
  const existingResume = useSelector(myGigsSelectors.getExistingResume);
  const resume = useSelector(applySelectors.getResume);
  const skillsAll = useSelector(gigsSelectors.getSkillsAll);
  const skills = useSelector(applySelectors.getSkills);

  const dispatch = useDispatch();

  const onFilePick = useCallback(
    (files) => {
      dispatch(applyActions.setResume(files[0]));
    },
    [dispatch]
  );

  const validateResume = useCallback(
    debounce(
      () => {
        dispatch(applyActions.validateResume());
      },
      DEBOUNCE_ON_CHANGE_TIME,
      { leading: false }
    ),
    [dispatch]
  );

  const onChangeSkills = useCallback(
    (skills) => {
      dispatch(applyActions.setSkills(skills));
    },
    [dispatch]
  );

  const onFocusSkills = useCallback(() => {
    dispatch(applyActions.touchSkills());
  }, [dispatch]);

  const validateSkills = useCallback(
    debounce(
      () => {
        dispatch(applyActions.validateSkills());
      },
      DEBOUNCE_ON_CHANGE_TIME,
      { leading: false }
    ),
    [dispatch]
  );

  useUpdateEffect(validateSkills, [skills.value]);

  useUpdateEffect(validateResume, [resume.isRequired, resume.value]);

  return (
    <div className={formStyles.section}>
      <div className={formStyles.sectionTitle}>Resume &amp; Skills</div>
      <div className={formStyles.sectionDescription}>
        Please upload your resume/CV. Double-check that all of your tech skills
        are listed in your resume/CV and add them to the tech skills section
        below
        {existingResume ? (
          <>
            ,{" "}
            <a target="_blank" rel="noreferrer" href={existingResume.file_link}>
              {existingResume.filename}
            </a>
          </>
        ) : (
          "."
        )}
      </div>
      <ResumeFilePicker
        file={resume.value}
        onFilePick={onFilePick}
        infoText="Drag & drop your resume or CV here - please omit contact information *"
        buttonText="SELECT A FILE"
        inputOptions={{
          accept: ".pdf,.docx",
        }}
        errorMsg={resume.error}
      />
      <MultiSelect
        className={styles.skillsField}
        showArrow
        isRequired
        label="Tech Skills"
        optLabelKey="name"
        optValueKey="id"
        placeholder="Tech Skills *"
        clearable={false}
        options={skillsAll}
        onChange={onChangeSkills}
        onFocus={onFocusSkills}
        size="large"
        value={skills.value}
        error={skills.error}
      />
    </div>
  );
};

export default ResumeAndSkills;
