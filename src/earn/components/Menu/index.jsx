import React, { useRef, useEffect } from "react";
import { navigate } from "@reach/router";
import PT from "prop-types";
import _ from "lodash";

import IconChevronUp from "../../../assets/icons/menu-chevron-up.svg";
import { MenuSelection, getMenuIcon } from "../../utils";

import "./styles.scss";

const Menu = ({ menu, selected, onSelect, isLoggedIn, onUpdateMenu }) => {
  const selectionRef = useRef();
  if (!selectionRef.current) {
    selectionRef.current = new MenuSelection(
      _.cloneDeep(menu),
      selected,
      onSelect,
      onUpdateMenu
    );
  }

  useEffect(() => {
    selectionRef.current.setMenu(menu);
  }, [menu]);

  useEffect(() => {
    selectionRef.current.select(selected);
  }, [selected]);

  // useEffect(() => {
  //   if (selectionRef.current.isAuth(selected) && isLoggedIn === false) {
  //     utils.auth.logIn();
  //   }
  // }, [selected, isLoggedIn]);

  const onSelectMenuItem = (name, path) => {
    selectionRef.current.select(name);
    if (path) {
      navigate(path);
    }
  };

  const getIcon = (menuItem, active) => {
    const name = active ? menuItem.iconActive : menuItem.icon;
    return getMenuIcon(name);
  };

  const isExpandable = (menuItem) =>
    selectionRef.current.isExpandable(menuItem);
  const isSelected = (menuItem) => selectionRef.current.isSelected(menuItem);
  const isExpanded = (menuItem) => selectionRef.current.isExpanded(menuItem);
  const isActive = (menuItem) => selectionRef.current.isActive(menuItem);

  const renderSubSubmenu = (subMenuItem) => {
    return (
      <ul styleName="sub-submenu">
        {subMenuItem.children.map((subSubmenuItem) => (
          <li
            styleName={`menu-item ${
              isSelected(subSubmenuItem) ? "selected" : ""
            } ${isActive(subSubmenuItem) ? "active" : ""} ${
              subMenuItem.auth ? "menu-item-auth" : ""
            }`}
            key={subSubmenuItem.name}
          >
            <span
              styleName="link"
              role="button"
              tabIndex="0"
              onClick={() => {
                onSelectMenuItem(subSubmenuItem.name, subSubmenuItem.path);
              }}
            >
              {subSubmenuItem.name}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderSubmenu = (menuItem) => {
    if (!menuItem.children) {
      return null;
    }

    return (
      <ul styleName="sub-menu">
        {menuItem.children.map((subMenuItem) => (
          <li
            styleName={`menu-item menu-item-secondary ${
              isExpandable(subMenuItem)
                ? isExpanded(subMenuItem)
                  ? "expanded"
                  : "collapsed"
                : isSelected(subMenuItem)
                ? "selected"
                : ""
            } ${isActive(subMenuItem) ? "active" : ""} ${
              menuItem.auth ? "menu-item-auth" : ""
            }`}
            key={subMenuItem.name}
          >
            <span
              styleName="link"
              role="button"
              tabIndex="0"
              onClick={() => {
                onSelectMenuItem(
                  subMenuItem.name,
                  isExpandable(subMenuItem) ? null : subMenuItem.path
                );
              }}
            >
              {subMenuItem.name}
            </span>
            {isExpandable(subMenuItem) && renderSubSubmenu(subMenuItem)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <nav>
      <ul styleName={`menu ${isLoggedIn ? "logged-in" : "logged-out"}`}>
        {selectionRef.current.menu.children.map((menuItem) => (
          <li
            styleName={`menu-item menu-item-main ${
              isExpandable(menuItem)
                ? isExpanded(menuItem)
                  ? "expanded"
                  : ""
                : isSelected(menuItem)
                ? "selected"
                : ""
            } ${isActive(menuItem) ? "active" : ""} ${
              menuItem.auth ? "menu-item-auth" : ""
            }`}
            key={menuItem.name}
          >
            <span
              styleName="link"
              role="button"
              tabIndex="0"
              onClick={() => {
                onSelectMenuItem(
                  menuItem.name,
                  isExpandable(menuItem) ? null : menuItem.path
                );
              }}
            >
              <span styleName="icon">
                {getIcon(menuItem, isActive(menuItem))}
              </span>
              <span styleName="text">{menuItem.name}</span>
              {isExpandable(menuItem) && (
                <span
                  styleName={`arrow ${isExpanded(menuItem) ? "up" : "down"}`}
                >
                  <IconChevronUp />
                </span>
              )}
            </span>
            {isExpandable(menuItem) && renderSubmenu(menuItem)}
          </li>
        ))}
      </ul>
    </nav>
  );
};

Menu.propTypes = {
  menu: PT.shape(),
  selected: PT.string,
  onSelect: PT.func,
  isLoggedIn: PT.oneOf([null, true, false]),
};

export default Menu;
