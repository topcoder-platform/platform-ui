import _ from "lodash";

export class MenuSelection {
  constructor(menu, selected, onSelect, onUpdateMenu) {
    this.menu = menu;
    this.onSelect = onSelect;
    this.selected = selected;
    this.onUpdateMenu = onUpdateMenu;
    this.travel(this.menu);
  }

  /**
   * @private
   */
  travel(root) {
    this.getMenuItems(root).forEach((menuItem) => {
      if (this.isBranch(menuItem)) {
        menuItem.expanded = false;
        this.travel(menuItem);
      } else {
        menuItem.active = this.selected === menuItem.name;
      }
    });
  }

  setMenu(menu) {
    this.menu = menu;
  }

  /**
   * @private
   */
  getMenuItems(menu) {
    return menu.children;
  }

  select(name) {
    let found = false;

    const selectInternal = (root) => {
      this.getMenuItems(root).forEach((menuItem) => {
        if (found) {
          return;
        }

        if (menuItem.name !== name) {
          if (this.isBranch(menuItem)) {
            selectInternal(menuItem);
          } else {
            menuItem.active = false;
          }
        } else {
          if (this.isLeaf(menuItem)) {
            menuItem.active = true;
            this.selected = menuItem.name;
            root.expanded = true;
          } else {
            menuItem.expanded = !menuItem.expanded;
          }

          found = true;
          this.emitSelectionEvent();
        }
      });
    };

    selectInternal(this.menu);
    this.onUpdateMenu(this.menu);
  }

  isSelected(menuItem) {
    return menuItem.name === this.selected;
  }

  isExpandable(menuItem) {
    return !!menuItem.children;
  }

  isExpanded(menuItem) {
    return menuItem.expanded;
  }

  isActive(menuitem) {
    const name = menuitem.name;
    const stack = {
      arr: [],
      push(name) {
        this.arr.push(name);
      },
      pop() {
        this.arr.splice(this.arr.length - 1, 1);
      },
    };
    let path;

    if (!this.selected) {
      return false;
    }

    const isActiveInternal = (root) => {
      this.getMenuItems(root).forEach((menuItem) => {
        if (menuItem.name !== this.selected) {
          if (this.isBranch(menuItem)) {
            stack.push(menuItem.name);
            isActiveInternal(menuItem);
            stack.pop();
          }
        } else {
          stack.push(menuItem.name);
          path = [...stack.arr];
        }
      });
    };

    isActiveInternal(this.menu);

    return path.indexOf(name) !== -1;
  }

  isAuth(name) {
    const stack = {
      arr: [],
      push(isAuth) {
        this.arr.push(isAuth);
      },
      pop() {
        this.arr.splice(this.arr.length - 1, 1);
      },
    };
    let path;

    const isAuthInternal = (root) => {
      this.getMenuItems(root).forEach((menuItem) => {
        if (this.isBranch(menuItem)) {
          stack.push(menuItem.auth);
          isAuthInternal(menuItem);
          stack.pop();
        } else if (menuItem.name === name) {
          stack.push(menuItem.auth);
          path = [...stack.arr];
        }
      });
    };

    isAuthInternal(this.menu);

    return _.some(path, Boolean);
  }

  emitSelectionEvent() {
    this.onSelect(this.selected);
  }

  isBranch(menuItem) {
    return menuItem.children != null;
  }

  isLeaf(menuItem) {
    return !this.isBranch(menuItem);
  }
}

export function getNameByPath(MENU, path) {
  const root = MENU;
  let name;

  const getNameByPathInternal = (root, path) => {
    root.children.forEach((menuItem) => {
      if (menuItem.children) {
        getNameByPathInternal(menuItem, path);
      } else if (menuItem.path === path) {
        name = menuItem.name;
      }
    });
  };

  getNameByPathInternal(root, path);

  return name;
}
