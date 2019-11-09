import React from 'react';
import {inject, observer} from 'mobx-react';
import {FeatureToggle} from 'react-feature-toggles';
import get from 'lodash/get';

import AttributionTable from 'components/pages/analyze/AttributionTable';
import Component from 'components/Component';
import ConversionJourney from 'components/pages/analyze/ConversionJourney';
import PerformanceGraph from 'components/pages/analyze/PerformanceGraph';
import FiltersPanel from 'components/pages/users/Filters/FiltersPanel';
import GeneratedImpact from 'components/pages/analyze/GeneratedImpact';
import FrequencySelect from 'components/pages/analyze/FrequencySelect';
import ChannelCards from'components/pages/analyze/ChannelCards';

import {formatNumberWithDecimalPoint} from 'components/utils/budget';
import {compose} from 'components/utils/utils';
import {getChannelsWithNicknames, getMetadata} from 'components/utils/channels';
import {getChannelIcon} from 'components/utils/filters/channels';

import style from 'styles/analyze/analyze.css';

const enhance = compose(
  inject(({
            attributionStore: {
              attributionModel,
              data,
              timeFrame,
              conversionIndicator,
              getMonthsIncludingCustom
            },
            analyze: {
              channelsStore: {
                channelsImpactByFrequency,
                channelsImpact,
                navigateToJourneys,
                filtersData,
                filtersStore: {
                  getMetricsData
                },
                frequency: {control}
              }
            }
          }) => ({
    attributionModel,
    data,
    getMetricDataByMapping: getMetricsData,
    timeFrame,
    channelsImpactByFrequency,
    channelsImpact,
    filtersData,
    frequencyControl: control,
    navigateToJourneys,
    conversionIndicator,
    getMonthsIncludingCustom
  })),
  observer
);

const getFirstObjective = (data) => get(data, 'calculatedData.objectives.firstObjective');

class Channels extends Component {
  style = style;
  state = {
    firstObjective: 'SQL'
  };

  initialize(props) {
    if (!props.calculatedData) {
      return;
    }

    //set objective
    this.setState({
      firstObjective: props.calculatedData.objectives.firstObjective
    });
  }

  componentDidMount() {
    const firstObjective = getFirstObjective(this.props.data);

    if (firstObjective) {
      this.setState({firstObjective});
    }
  }

  componentWillReceiveProps({data: nextData, conversionIndicator: nextConversionIndicator}) {
    const {data, conversionIndicator} = this.props;
    const nextFirstObjective = getFirstObjective(nextData);

    if (nextFirstObjective && nextFirstObjective !== getFirstObjective(data)) {
      this.setState({
        firstObjective: nextFirstObjective
      });
    }
    else if (nextConversionIndicator !== conversionIndicator) {
      this.setState({
        firstObjective: nextConversionIndicator
      });
    }
  }

  filterDirect = ({value: channelKey}) => channelKey !== 'direct';

  onRowClick = ({value: channelKey}, funnelStage) => {
    this.props.navigateToJourneys(funnelStage, channelKey);
  };

  render() {
    const {
      attributionModel,
      data,
      getMetricDataByMapping,
      timeFrame,
      filtersData,
      frequencyControl,
      channelsImpact,
      channelsImpactByFrequency,
      conversionIndicator
    } = this.props;

    if (!Object.keys(data).length) {
      return null;
    }

    const {
      calculatedData: {
        daily,
        historyData: {
          sumActualBudgets,
          indicatorsDataPerMonth,
          months
        }
      }
    } = data;
    const {customDateMode} = timeFrame;

    const {firstObjective} = this.state;
    const indicators = customDateMode ? daily.indicatorsDataPerMonth : indicatorsDataPerMonth;
    const sumBudgets = customDateMode ? daily.sumActualBudgets : sumActualBudgets;

    const getChannelTitle = ({value: channelKey, label}) => ({
      text: label,
      node: (
        <div className={this.classes.cellWithIcon}>
          <div className={this.classes.channelIcon} data-icon={getChannelIcon(channelKey)}/>
          {label}
        </div>
      )
    });

    const channelsArray = getChannelsWithNicknames();
    channelsArray.push({value: 'direct', label: 'Direct'});

    const convIndicatorImpact = channelsImpact && channelsImpact[conversionIndicator];
    const fatherChannelsWithBudgets = [];
    let fatherChannelsSum = 0;
    convIndicatorImpact && Object.keys(convIndicatorImpact).forEach(channel => {
      const channelCategory = getMetadata('category', channel);
      if (channelCategory && convIndicatorImpact[channel]) {
        fatherChannelsSum += convIndicatorImpact[channel];
        const existsFather = fatherChannelsWithBudgets.find(item => item.name === channelCategory);
        if (existsFather) {
          existsFather.value += convIndicatorImpact[channel];
        }
        else {
          fatherChannelsWithBudgets.push({name: channelCategory, value: convIndicatorImpact[channel]});
        }
      }
    });

    // format channelImpact from { [dataKey]: { [channelKey] }} to { [channelKey]: { [dataKey] }}
    const channelsImpactData = Object.keys(channelsImpact).reduce((res, dataKey) => {
      const data = channelsImpact[dataKey];

      Object.keys(data).forEach((channelKey) => {
        res[channelKey] = {
          ...res[channelKey],
          [dataKey]: data[channelKey]
        };
      });

      return res;
    }, {});

    const channelsData = channelsArray
      .filter((channel) => !!channelsImpactData[channel.value])
      .map((channel) => ({...channel, ...channelsImpactData[channel.value]}));

    return (
      <div>
        <div className={this.classes.filtersPanel}>
          <FiltersPanel {...filtersData}/>
        </div>
        <ChannelCards 
          funnelFirstObjective={conversionIndicator} 
          channelsData={channelsData}
          getItemCost={(channel) => sumBudgets[channel.value] || 0}
        />
        <FeatureToggle featureName="attribution">
          <React.Fragment>
            <div className={this.classes.rows}>
              <GeneratedImpact
                data={channelsImpactByFrequency}
                valuesFormatter={formatNumberWithDecimalPoint}
                title="Marketing-Generated Business Impact"
              >
                <FrequencySelect {...frequencyControl}/>
              </GeneratedImpact>
            </div>
            <AttributionTable
              key={conversionIndicator}
              defaultStageKey={conversionIndicator}
              title='Channels Impacts Analysis'
              data={channelsData}
              getItemCost={(channel) => {
                return sumBudgets[channel.value] || 0;
              }}
              dataNickname='Channel'
              getItemTitle={getChannelTitle}
              attributionModel={attributionModel.label}
              onClick={this.onRowClick}
              showRowClick={this.filterDirect}
            />
            <ConversionJourney
              conversionIndicator={conversionIndicator}
              chartData={fatherChannelsWithBudgets}
              chartDataSum={fatherChannelsSum}
              getMetricDataByMapping={getMetricDataByMapping}
            />
          </React.Fragment>
        </FeatureToggle>
        <div className={this.classes.rows}>
          <PerformanceGraph
            isPast={true}
            months={months ? months.length : 1}
            customDateMode={customDateMode}
            customDate={timeFrame}
            data={indicators}
            defaultIndicator={firstObjective}
          />
        </div>
      </div>
    );
  }
}

export default enhance(Channels);
