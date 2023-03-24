/* eslint-disable */
import IconMyWork from '../../assets/icons/my-work.svg';
import IconMyWorkActive from '../../assets/icons/my-work-green.svg';
import IconFindWork from '../../assets/icons/find-work.svg';
import IconFindWorkActive from '../../assets/icons/find-work-green.svg';

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
