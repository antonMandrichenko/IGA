import {decorate, observable, action, computed} from 'mobx';
import {createTransformer} from 'mobx-utils';
import {get} from 'lodash';

import {filter} from 'components/utils/users';
import {getFilterOptions} from 'components/utils/filters/configs';
import {filterKinds, makeFilters} from 'components/utils/filters';
import attributionStore from 'stores/attributionStore';
import userStore from 'stores/userStore';

class FiltersStore {
  static persistSchema = {
    rawFilters: {
      type: 'list'
    },
    searchQuery: true
  };

  constructor(dynamicFilterConfigs) {
    this.rawFilters = [];
    this.searchQuery = '';
    this.dynamicFilterConfigs = dynamicFilterConfigs;
  }

  get customFieldsConfig() {
    const {CRMConfig} = attributionStore.data;
    const customFieldNames = (CRMConfig && CRMConfig.customFieldsNicknames) || [];

    if (customFieldNames.length === 0) {
      return;
    }

    const fieldKeys = [];
    for (let i = 1; i <= customFieldNames.length; i++) {
      const key = `uniqCustom${i}`;
      fieldKeys.push(key);
    }

    return {
      kind: filterKinds.CUSTOM_FIELDS,
      options: [],
      getOptions: (users) => fieldKeys.map(key => getFilterOptions(users, key)),
      fieldKey: fieldKeys,
      fieldNames: customFieldNames
    };
  }

  get extendedDynamicFilterConfigs() {
    const permissions = get(userStore, 'userAccount.permissions', {});

    return this.dynamicFilterConfigs.map((config) => {
      if (config.kind === filterKinds.CUSTOM_FIELDS) {
        return this.customFieldsConfig;
      }

      if (config.kind === filterKinds.CRMSource && !permissions.CRMLeadSource) {
        return;
      }

      return {options: [], ...config};
    }).filter(Boolean);
  }

  get filters() {
    return makeFilters(this.rawFilters, this.extendedDynamicFilterConfigs);
  }

  setFilters(filters) {
    this.rawFilters = filters.map(({config, data}) => ({data, kind: config.kind}));
  }

  setSearchQuery(searchQuery) {
    this.searchQuery = searchQuery;
  }

  get filterConfigs() {
    return this.extendedDynamicFilterConfigs
      .map(({
              getOptions = (users) => getFilterOptions(users, config.fieldKey),
              ...config
            }) => ({
        ...config,
        getOptions
      }));
  }

  get usersByEmail() {
    return filter(
      get(attributionStore, 'data.attribution.usersByEmail', []),
      this.filters,
      this.searchQuery
    );
  };

  get usersByAccount() {
    return filter(
      get(attributionStore, 'data.attribution.usersByAccount', []),
      this.filters,
      this.searchQuery
    );
  };

  get filtersData() {
    return {
      filters: this.filters,
      filterConfigs: this.filterConfigs,
      setFilters: this.setFilters,
      data: this.usersByEmail
    };
  }

  getMetricsData = createTransformer((metric) =>
    attributionStore.data.attribution.groupByMapping[metric] === 'contacts'
      ? this.usersByEmail
      : this.usersByAccount
  );

  getMetricsDataFiltered = createTransformer((indicator) =>
    attributionStore.getMetricsDataFiltered(indicator, this.getMetricsData)
  );

  calculateAttributionWeights = attributionStore.calculateAttributionWeights;
}

decorate(FiltersStore, {
  usersByEmail: computed,
  usersByAccount: computed,
  rawFilters: observable.ref,
  filters: computed,
  filterConfigs: computed,
  customFieldsConfig: computed,
  extendedDynamicFilterConfigs: computed,
  filtersData: computed,
  setFilters: action.bound,
  searchQuery: observable.ref,
  setSearchQuery: action.bound,
});

export default FiltersStore;
