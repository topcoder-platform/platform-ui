import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Menu from "@earn/components/Menu";
import * as constants from "@earn/constants";
import { getNameByPath } from "@earn/utils";

const MenuContainer = () => {
  const [selectedMenuItemName, setSelectedMenuItemName] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [menu, saveMenu] = useState(constants.NAV_MENU);
  const location = useLocation();

  // // isLoggedIn
  // useEffect(() => {
  //   const checkIsLoggedIn = async () => {
  //     setIsLoggedIn(await utils.auth.isLoggedIn());
  //   };
  //   checkIsLoggedIn();
  // }, []);

  // selected
  useEffect(() => {
    const name = getNameByPath(
      constants.NAV_MENU,
      location.pathname
    );
    if (name) {
      setSelectedMenuItemName(name);
    } else {
      setSelectedMenuItemName(null);
    }
  }, [location]);

  return (
    <Menu
      menu={menu}
      selected={selectedMenuItemName}
      onSelect={(name) => {
        setSelectedMenuItemName(name);
      }}
      isLoggedIn={isLoggedIn}
      onUpdateMenu={(menu) => {
        const change = { ...menu };
        saveMenu(change);
      }}
    />
  );
};

export default MenuContainer;
