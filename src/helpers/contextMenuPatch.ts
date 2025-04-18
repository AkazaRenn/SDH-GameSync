// Derived from https://github.com/SteamGridDB/decky-steamgriddb/blob/main/src/patches/contextMenuPatch.tsx

import { createElement, FC } from 'react';
import {
  afterPatch,
  fakeRenderComponent,
  findInReactTree,
  findModuleByExport,
  Export,
  MenuItem,
  Patch,
} from '@decky/ui';
import { CONTEXT_MENU_GAME_FILTER_KEY as CONTEXT_MENU_SYNC_FILTER_KEY } from "./commonDefs";
import SyncTargetConfigPage from "../pages/syncTargetConfigPage";
import Registeration from '../types/registeration';

// Always add before "Properties..."
const spliceMenuItem = (children: any[], appid: number) => {
  children.find((x: any) => x?.key === 'properties');
  const propertiesMenuItemIdx = children.findIndex((item) =>
    findInReactTree(item, (x) => x?.onSelected && x.onSelected.toString().includes('AppProperties'))
  );
  children.splice(propertiesMenuItemIdx, 0, (
    createElement(MenuItem, {
      key: CONTEXT_MENU_SYNC_FILTER_KEY,
      onSelected: () => {
        SyncTargetConfigPage.enter({ appId: String(appid) });
      },
      children: "Sync Logs & Filters"
    })
  ));
};

/**
 * Patches the game context menu.
 * @param LibraryContextMenu The game context menu.
 * @returns A patch to remove when the plugin dismounts.
 */
const patchContextMenu = (LibraryContextMenu: any) => {
  let innerPatch: Patch;
  let outerPatch = afterPatch(LibraryContextMenu.prototype, 'render', (_: Record<string, unknown>[], component: any) => {
    const appid: number = component._owner.pendingProps.overview.appid;

    if (!innerPatch) {
      innerPatch = afterPatch(component.type.prototype, 'shouldComponentUpdate', ([nextProps]: any, shouldUpdate: any) => {
        try {
          const idx = nextProps.children.findIndex((x: any) => x?.key === CONTEXT_MENU_SYNC_FILTER_KEY);
          if (idx != -1) nextProps.children.splice(idx, 1);
        } catch (error) {
          // wrong context menu (probably)
          return component;
        }

        if (shouldUpdate === true) {
          let updatedAppid: number = appid;
          // find the first menu component that has the correct appid assigned to _owner
          const parentOverview = nextProps.children.find((x: any) => x?._owner?.pendingProps?.overview?.appid &&
            x._owner.pendingProps.overview.appid !== appid
          );
          // if found then use that appid
          if (parentOverview) {
            updatedAppid = parentOverview._owner.pendingProps.overview.appid;
          }
          spliceMenuItem(nextProps.children, updatedAppid);
        }

        return shouldUpdate;
      });
    } else {
      spliceMenuItem(component.props.children, appid);
    }

    return component;
  });
  return () => {
    outerPatch?.unpatch();
    innerPatch?.unpatch();
  };
};

/**
 * Game context menu component.
 */
const LibraryContextMenu = fakeRenderComponent(
  Object.values(
    findModuleByExport((e: Export) => e?.toString && e.toString().includes('().LibraryContextMenu'))
  ).find((sibling) => (
    sibling?.toString().includes('createElement') &&
    sibling?.toString().includes('navigator:')
  )) as FC
).type;


class ContextMenuPatch extends Registeration {
  protected _register(): UnregisterFunction {
    return patchContextMenu(LibraryContextMenu);
  }
}

const contextMenuPatch = new ContextMenuPatch();
export default contextMenuPatch;
