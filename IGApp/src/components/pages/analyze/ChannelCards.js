import React from 'react';
import PropTypes from 'prop-types';
import Component from 'components/Component';
import TopContributorCard from 'components/pages/analyze/TopContributorCard';
import MostEfficientCard from 'components/pages/analyze/MostEfficientCard';
import TrendingCard from 'components/pages/analyze/TrendingCard';
import analyzeStyle from 'styles/analyze/analyze.css';
import { getChannelIcon } from 'components/utils/channels';
import {precisionFormat} from 'utils';

class ChannelCards extends Component {
  styles = [analyzeStyle];

  static propTypes = {
    funnelFirstObjective: PropTypes.string.isRequired,
    channelsData: PropTypes.array.isRequired,
    getItemCost: PropTypes.func
  }

  getTopContributorData(funnelFirstObjective, channelsData) {

    const data = channelsData
    .filter(item=>item.hasOwnProperty(funnelFirstObjective) && item.value !== 'direct' && item[funnelFirstObjective] && !isNaN(item[funnelFirstObjective]) && isFinite(item[funnelFirstObjective]))
    .sort((a,b)=>b[funnelFirstObjective] - a[funnelFirstObjective]);

    let topContributorData = null;
    if (data[0]) {
      topContributorData = { icon: getChannelIcon(data[0].value), background: "/assets/channels-icons/trophy.svg", label: data[0].label, value: data[0][funnelFirstObjective]};
    }

    return topContributorData;
  }

  getMostEfficientData(funnelFirstObjective, channelsData, getItemCost) {
    
    const data = channelsData.map(item => { 
      var temp = Object.assign({},item);
      temp.efficiency = getItemCost(temp) / precisionFormat(temp[funnelFirstObjective]);
      return temp; 
    })
    .filter(item=>item.hasOwnProperty(funnelFirstObjective))
    .sort((a,b)=>a.efficiency - b.efficiency)
    .filter(item=>item.efficiency > 0 && item.value !== "direct" && !isNaN(item.efficiency) && isFinite(item.efficiency));

    let mostEfficientData = null;
    if (data[0]) {
      mostEfficientData = { icon: getChannelIcon(data[0].value), background: "/assets/channels-icons/efficiency.svg", label: data[0].label, value: data[0].efficiency };
    }
    
    return mostEfficientData;
  }

  render() {
    const {funnelFirstObjective, channelsData, getItemCost} = this.props;
    
    if (!channelsData.length) {
      return null;
    }
    
    const topContributorData = this.getTopContributorData(funnelFirstObjective, channelsData);
    const mostEfficientData = this.getMostEfficientData(funnelFirstObjective, channelsData, getItemCost);
    const trendingData = null;

    if (topContributorData || mostEfficientData || trendingData) {
      return (
        <div className={analyzeStyle.locals.rows + ' ' + analyzeStyle.locals.cardContainer}>
          <TopContributorCard
            funnelFirstObjective = {funnelFirstObjective}
            data = {topContributorData}/>
          <MostEfficientCard
            funnelFirstObjective = {funnelFirstObjective}
            data = {mostEfficientData}/>
          <TrendingCard
            funnelFirstObjective = {funnelFirstObjective}
            data = {trendingData}/>
        </div>
      );
    }

    return null;
  }
}
export default ChannelCards;