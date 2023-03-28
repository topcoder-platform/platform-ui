/* eslint-disable */
import IconMyWork from '@earn/assets/icons/my-work.svg';
import IconMyWorkActive from '@earn/assets/icons/my-work-green.svg';
import IconFindWork from '@earn/assets/icons/find-work.svg';
import IconFindWorkActive from '@earn/assets/icons/find-work-green.svg';

import IconTrackDes from '@earn/assets/icons/track-des.svg'
import IconTrackDev from '@earn/assets/icons/track-dev.svg'
import IconTrackDS from '@earn/assets/icons/track-ds.svg'
import IconTrackQA from '@earn/assets/icons/track-qa.svg'

import * as constants from '@earn/constants';

export function getMenuIcon(name) {
  let icon;
  switch (name) {
    case 'my-work.svg': icon = <IconMyWork />; break;
    case 'my-work-green.svg': icon = <IconMyWorkActive />; break;
    case 'find-work.svg': icon = <IconFindWork />; break;
    case 'find-work-green.svg': icon = <IconFindWorkActive />; break;
    default: icon = null;
  }
  return icon;
}

export function createTrackIcon (track, type, tcoEligible) {
  let trackIcon;
  let typeIcon;
  let tcoEventIcon;

  const DESIGN = constants.FILTER_CHALLENGE_TRACKS[0];
  const DEVELOPMENT = constants.FILTER_CHALLENGE_TRACKS[1];
  const DATA_SCIENCE = constants.FILTER_CHALLENGE_TRACKS[2];
  const QUALITY_ASSURANCE = constants.FILTER_CHALLENGE_TRACKS[3];

  const CHALLENGE = constants.FILTER_CHALLENGE_TYPES[0];
  const FIRST2FINISH = constants.FILTER_CHALLENGE_TYPES[1];
  const TASK = constants.FILTER_CHALLENGE_TYPES[2];

  switch (track) {
    case DESIGN: trackIcon = <IconTrackDes />; break;
    case DEVELOPMENT: trackIcon = <IconTrackDev />; break;
    case DATA_SCIENCE: trackIcon = <IconTrackDS />; break;
    case QUALITY_ASSURANCE: trackIcon = <IconTrackQA />; break;
  }

  switch (type) {
    case CHALLENGE: typeIcon = null; break;
    case FIRST2FINISH: typeIcon = createF2FIcon(constants.TRACK_COLOR[track]); break;
    case TASK: typeIcon = createTaskIcon(constants.TRACK_COLOR[track]); break;
  }

  if (tcoEligible) {
    tcoEventIcon = createTCOEventIcon(constants.TRACK_COLOR[track]);
  }

  return (
    <div className="track-icon">
      {trackIcon}
      {typeIcon}
      {tcoEventIcon}
    </div>
  );
}

function createTaskIcon (color) {
  return (
    <svg width="45px" height="48px" viewBox="0 0 45 48" version="1.1">
      <defs>
          <filter id="filter-1">
              <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1.000000 0 0 0 0 1.000000 0 0 0 0 1.000000 0 0 0 1.000000 0"></feColorMatrix>
          </filter>
      </defs>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
          <g transform="translate(-345.000000, -1162.000000)">
              <g transform="translate(329.000000, 1144.000000)">
                  <g transform="translate(16.000000, 18.000000)">
                      <g transform="translate(23.000000, 23.000000)">
                          <circle stroke="#FFFFFF" strokeWidth="2" cx="10" cy="10" r="11"></circle>
                          <circle fill={color} cx="10" cy="10" r="10"></circle>
                          <g filter="url(#filter-1)">
                              <g transform="translate(4.500000, 4.250000)">
                                  <path d="M10.2142857,0 L0.785714286,0 C0.314285714,0 0,0.275 0,0.6875 L0,10.3125 C0,10.725 0.314285714,11 0.785714286,11 L10.2142857,11 C10.6857143,11 11,10.725 11,10.3125 L11,0.6875 C11,0.275 10.6857143,0 10.2142857,0 Z M5.5,8.9375 L2.35714286,8.9375 L2.35714286,7.5625 L5.5,7.5625 L5.5,8.9375 Z M8.64285714,6.1875 L2.35714286,6.1875 L2.35714286,4.8125 L8.64285714,4.8125 L8.64285714,6.1875 Z M8.64285714,3.4375 L2.35714286,3.4375 L2.35714286,2.0625 L8.64285714,2.0625 L8.64285714,3.4375 Z" fill={color} fillRule="nonzero"></path>
                              </g>
                          </g>
                      </g>
                  </g>
              </g>
          </g>
      </g>
    </svg>
  );
}

function createF2FIcon (color) {
  return (
    <svg width="46px" height="51px" viewBox="0 0 46 51" version="1.1">
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
          <g transform="translate(-344.000000, -391.000000)">
              <g transform="translate(329.000000, 373.000000)">
                  <g transform="translate(15.000000, 18.750000)">
                      <g transform="translate(24.000000, 23.958333)">
                          <ellipse stroke="#FFFFFF" strokeWidth="2" cx="10" cy="10.4166667" rx="11" ry="11.4166667"></ellipse>
                          <ellipse fill={color} cx="10" cy="10.4166667" rx="10" ry="10.4166667"></ellipse>
                          <path d="M15.5,4.6875 L15.5,13.8541667 L5.96666667,13.8541667 L5.96666667,16.9097222 L4.5,16.9097222 L4.5,4.6875 L15.5,4.6875 Z M7.43333333,10.7986111 L5.96666667,10.7986111 L5.96666667,12.3263889 L7.43333333,12.3263889 L7.43333333,10.7986111 Z M11.8333333,10.7986111 L10.3666667,10.7986111 L10.3666667,12.3263889 L11.8333333,12.3263889 L11.8333333,10.7986111 Z M9.63333333,8.50694444 L8.16666667,8.50694444 L8.16666667,10.0347222 L9.63333333,10.0347222 L9.63333333,8.50694444 Z M14.0333333,8.50694444 L12.5666667,8.50694444 L12.5666667,10.0347222 L14.0333333,10.0347222 L14.0333333,8.50694444 Z M7.43333333,6.21527778 L5.96666667,6.21527778 L5.96666667,7.74305556 L7.43333333,7.74305556 L7.43333333,6.21527778 Z M11.8333333,6.21527778 L10.3666667,6.21527778 L10.3666667,7.74305556 L11.8333333,7.74305556 L11.8333333,6.21527778 Z" fill="#FFFFFF"></path>
                      </g>
                  </g>
              </g>
          </g>
      </g>
    </svg>
  );
}

function createTCOEventIcon (color) {
  return (
    <svg width="44px" height="48px" viewBox="0 0 44 48" version="1.1">
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
          <g transform="translate(-346.000000, -264.000000)">
              <g transform="translate(329.000000, 245.000000)">
                  <g transform="translate(17.000000, 19.531250)">
                      <text fontFamily="Helvetica" fontSize="11" fontWeight="normal" linespacing="12" fill={color}>
                          <tspan x="0" y="44.8854167">TCO</tspan>
                      </text>
                      <g transform="translate(22.000000, 23.177083)">
                          <ellipse stroke="#FFFFFF" strokeWidth="2" cx="10" cy="10.4166667" rx="11" ry="11.4166667"></ellipse>
                          <ellipse fill={color} cx="10" cy="10.4166667" rx="10" ry="10.4166667"></ellipse>
                          <g id="Shape-2" transform="translate(4.000000, 4.166667)" fill="#FFFFFF">
                              <path d="M0,0.520833333 L0,3.64583333 C0,5.25948786 1.20276465,6.77083333 3.10606388,6.77083333 C3.36433418,7.80948005 4.11799628,8.62911544 5.0926209,8.95322161 C4.95899962,9.6853574 4.7114868,10.6023629 4.25042723,11.4583333 L3,11.4583333 L3,13.0208333 L9,13.0208333 L9,11.4583333 L7.74957278,11.4583333 C7.2885132,10.6023629 7.04100038,9.6853574 6.90737918,8.95322161 C7.8820038,8.62911544 8.6356659,7.80948005 8.89393612,6.77083333 C10.7909553,6.77083333 12,5.26441201 12,3.64583333 L12,0.520833333 L0,0.520833333 Z M1.5,3.64583333 L1.5,2.08333333 L3,2.08333333 L3,5.20833333 C2.17309567,5.20833333 1.5,4.50757341 1.5,3.64583333 Z M10.5,3.64583333 C10.5,4.50757341 9.82690432,5.20833333 9,5.20833333 L9,2.08333333 L10.5,2.08333333 L10.5,3.64583333 Z"></path>
                          </g>
                      </g>
                  </g>
              </g>
          </g>
      </g>
    </svg>
  );
}

export function createBadgeElement(htmlElement, content) {
  const badgeElement = document.createElement('span');

  badgeElement.classList.add('count-badge');
  badgeElement.textContent = content;
  htmlElement.appendChild(badgeElement);

  return badgeElement;
}

// export function createCompanyLogo() {
//   return (
// <svg width="44px" height="64px" viewBox="0 0 44 64" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
//     <title>9825381A-BF03-46A3-AD6D-206A06A2B45D</title>
//     <g id="Screens" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
//         <g id="03_2_My-Gigs" transform="translate(-346.000000, -807.000000)" fill-rule="nonzero">
//             <g id="Group-11" transform="translate(305.000000, 182.000000)">
//                 <g id="Group-10-Copy-7" transform="translate(0.000000, 412.000000)">
//                     <g id="Group-9" transform="translate(0.000000, 142.000000)">
//                         <g id="Group-10" transform="translate(19.000000, 47.000000)">
//                             <g id="Group-Copy-2" transform="translate(22.000000, 24.000000)">
//                                 <path d="M43.125,0 L43.125,64 L40.946,63.81 C37.299,63.21 33.573,62.777 29.87,62.521 L28.125,62.4 L28.125,7.5 L43.125,0 Z" id="Path_80" fill="#D5011D"></path>
//                                 <polygon id="Path_81" fill="#AA011A" points="15 0.166 15 56.666 0 63.998 0 0.166"></polygon>
//                                 <path d="M21.563,16.264 L25.313,16.264 L21.563,47.854 L14.982,62.408 L13.875,62.479 C9.965,62.729 6.029,63.179 2.175,63.81 L-0.004,64 L21.563,16.264 Z" id="Path_82" fill="#D5011D"></path>
//                                 <polygon id="Path_83" fill="#FF0021" points="28.808 0.166 43.124 0.166 21.561 47.855 21.561 16.265"></polygon>
//                             </g>
//                         </g>
//                     </g>
//                 </g>
//             </g>
//         </g>
//     </g>
// </svg>
// )
// }
