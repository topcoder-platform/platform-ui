import formStyles from "../ApplicationForm/styles.scss";
import React from "react";
import { useSelector } from "react-redux";
import TextField from "components/TextField";
import * as myGigsSelectors from "reducers/myGigsSelectors";
import { makeProfileUrl } from "utils/url";

const TopcoderInfo = () => {
  const { handle } = useSelector(myGigsSelectors.getProfile);

  return (
    <div className={formStyles.section}>
      <div className={formStyles.sectionTitle}>Topcoder Information</div>
      <div className={formStyles.fieldRowList}>
        <div className={formStyles.fieldRow}>
          <TextField
            className={formStyles.field}
            label="Topcoder Username"
            name="handle"
            size="large"
            isReadonly
            value={handle}
          />
          <TextField
            className={formStyles.field}
            label="Topcoder Profile"
            name="profile_url"
            size="large"
            isReadonly
            value={makeProfileUrl(handle)}
          />
        </div>
      </div>
    </div>
  );
};

export default TopcoderInfo;
