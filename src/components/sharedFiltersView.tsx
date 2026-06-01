import { PropsWithChildren } from "react";
import { SHARED_FILTER_APP_ID } from "../helpers/commonDefs";
import FiltersView from "./filtersView";
import SyncFilters from "../helpers/syncFilters";

interface SharedFiltersViewProps {
  description?: string;
}

export default function sharedFiltersView({ description, children }: PropsWithChildren<SharedFiltersViewProps>) {
  return (<FiltersView
    description={description}
    getFiltersFunction={() => SyncFilters.get(SHARED_FILTER_APP_ID)}
    setFiltersFunction={(filters: Array<string>) => SyncFilters.set(SHARED_FILTER_APP_ID, filters)}
  >
    {children}
  </FiltersView>);
}