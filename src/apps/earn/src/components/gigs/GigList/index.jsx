import styles from "./styles.scss";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import GigItem from "../GigItem";
import GigHotItem from "../GigHotItem";
import * as selectors from "../../../reducers/gigs/selectors";
import actions from "../../../actions/gigs/creators";
import { GIGS_HOT_INDEX } from "../../../constants";

/**
 * Displays gigs' list with promo gigs.
 *
 * @returns {JSX.Element}
 */
const GigList = () => {
  const gigs = useSelector(selectors.getGigs);
  let filteredGigsFeatured = useSelector(selectors.getFilteredGigsFeatured);
  const filteredGigsHot = useSelector(selectors.getFilteredGigsHot);
  const pageNumber = useSelector(selectors.getPageNumber);
  const dispatch = useDispatch();

  const gigsHotIndex = Math.min(
    filteredGigsFeatured.length - 1,
    GIGS_HOT_INDEX
  );

  const onClickSkill = useCallback(
    (event) => {
      event.preventDefault();
      let target = event.target;
      let dataset = target.dataset;
      dispatch(actions.addSkill({ id: dataset.id, name: target.textContent }));
    },
    [dispatch]
  );

  return (
    <div className={styles["container"]}>
      {pageNumber == 1 &&
        filteredGigsFeatured?.map((gig, gigIndex) =>
          gigIndex === gigsHotIndex ? (
            <React.Fragment key={`gig-hotlist-fragment-${gig.id}`}>
              {gig && (
                <GigItem
                  key={gig.id}
                  className={styles.gigItem}
                  gig={gig}
                  onClickSkill={onClickSkill}
                />
              )}
              <div key="gig-hotlist" className={styles["gig-hotlist"]}>
                {filteredGigsHot?.map((gig, gigHotIndex) => (
                  <div key={gig.id} className={styles["gig-hot"]}>
                    <GigHotItem
                      key={gig.id}
                      className={styles.gigHotItem}
                      index={gigHotIndex}
                      gig={gig}
                    />
                  </div>
                ))}
              </div>
              <div
                key="row-color-preserver"
                className={styles["row-color-preserver"]}
              />
            </React.Fragment>
          ) : (
            gig && (
              <GigItem
                key={gig.id}
                className={styles.gigItem}
                gig={gig}
                onClickSkill={onClickSkill}
              />
            )
          )
        )}
      {gigs.map((gig) => (
        <GigItem
          key={gig.id}
          className={styles.gigItem}
          gig={gig}
          onClickSkill={onClickSkill}
        />
      ))}
    </div>
  );
};

export default GigList;
