import { decorate, computed, observable } from 'mobx'
import { persist } from 'mobx-persist';
import { get } from 'lodash';

import {campaignsPageConfig} from 'components/utils/filters/configs';
import {makeCampaignBeforeStageFilter} from 'components/utils/filters/make';
import {calculateAttributionCampaigns, calculateCampaignsImpactByFrequency, getFormatPeriod} from 'attribution/campaigns';
import attributionStore from 'stores/attributionStore';
import userStore from 'stores/userStore';
import FiltersStore from 'stores/analyze/filtersStore';
import journeysStore from 'stores/analyze/journeysStore';
import hydrate from 'stores/hydrate';
import FrequencyStore from 'stores/analyze/frequencyStore';

const filtersStore = persist(FiltersStore.persistSchema)(new FiltersStore(campaignsPageConfig));

hydrate('campaignsFilters', filtersStore)

class CampaignsStore {
  constructor() {
    this.filtersStore = filtersStore;
    this.frequency = new FrequencyStore();
  }

  get campaigns() {
    const {usersByEmail, getMetricsData, calculateAttributionWeights} = filtersStore;
    const {userMonthPlan} = userStore;
    const groupByMapping = get(attributionStore, 'data.attribution.groupByMapping', {});

    return calculateAttributionCampaigns(
      groupByMapping,
      usersByEmail,
      getMetricsData,
      userMonthPlan,
      calculateAttributionWeights
    );
  }

  get filtersData() {
    return filtersStore.filtersData
  }

  get campaignsImpactByFrequency() {
    const {getMetricsDataFiltered, calculateAttributionWeights} = filtersStore;
    const {userMonthPlan} = userStore;
    const {conversionIndicator, tsRange} = attributionStore;
    const groupByMapping = get(attributionStore, 'data.attribution.groupByMapping', {});

    return calculateCampaignsImpactByFrequency(
      groupByMapping,
      getMetricsDataFiltered,
      userMonthPlan,
      calculateAttributionWeights,
      this.frequency,
      tsRange,
      getFormatPeriod(conversionIndicator)
    );
  }

  navigateToJourneys = (funnelStage, campaignName) => {
    journeysStore.navigateWithFilters(
      funnelStage,
      [makeCampaignBeforeStageFilter(campaignName, funnelStage), ...filtersStore.rawFilters]
    );
  }
}

decorate(CampaignsStore, {
  campaigns: computed,
  campaignsImpactByFrequency: computed,
  filtersData: computed,
  frequency: observable.ref,
});

export default new CampaignsStore();
