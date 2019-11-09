import React from 'react';
import PropTypes from 'prop-types';
import Component from 'components/Component';
import TopContributorCard from 'components/pages/analyze/TopContributorCard';
import MostEfficientCard from 'components/pages/analyze/MostEfficientCard';
import TrendingCard from 'components/pages/analyze/TrendingCard';
import analyzeStyle from 'styles/analyze/analyze.css';
import { getChannelIcon } from 'components/utils/channels';
import {precisionFormat} from 'utils';

class CampaignCards extends Component {
  styles = [analyzeStyle];

  static propTypes = {
    funnelFirstObjective: PropTypes.string.isRequired,
    campaignData: PropTypes.array.isRequired,
    getItemCost: PropTypes.func
  }

  getTopContributorData(funnelFirstObjective, campaignData) {
    const data = campaignData
    .filter(item=> item.hasOwnProperty(funnelFirstObjective) && item.value !== 'direct' && item[funnelFirstObjective] !== 0 && isFinite(item[funnelFirstObjective]) && !isNaN(item[funnelFirstObjective]))
    .sort((a,b)=> b[funnelFirstObjective] - a[funnelFirstObjective]);
    
    let topContributorData = null;
    if (data[0]) {
      topContributorData = { background: "/assets/channels-icons/trophy.svg", label: data[0].name, value: data[0][funnelFirstObjective]};
      
      if (data[0].channels.length == 1) {
        topContributorData.icon = getChannelIcon(data[0].channels[0]);
      }
      else if (data[0].channels.length >= 2) {
        topContributorData.icon = "plan:multiChannel";
      }
    }
    
    return topContributorData;

  }
  
  getMostEfficientData(funnelFirstObjective, campaignData, getItemCost) {
    const data = campaignData
    .map(item => { 
      item.efficiency = getItemCost(item) / precisionFormat(item[funnelFirstObjective]);
      return item; 
    })
    .filter(item=>item.hasOwnProperty(funnelFirstObjective))
    .sort((a,b)=>a.efficiency - b.efficiency)
    .filter(item=>item.efficiency > 0 && item.value !== "direct" && isFinite(item.efficiency) && !isNaN(item.efficiency));

    let mostEfficientData = null;
    if (data[0]) {
      mostEfficientData = { icon: getChannelIcon(data[0].value), background: "/assets/channels-icons/efficiency.svg", label: data[0].name, value: data[0].efficiency };

      if (data[0].channels.length == 1) {
        mostEfficientData.icon = getChannelIcon(data[0].channels[0]);
      }
      else if (data[0].channels.length >= 2) {
        mostEfficientData.icon = "plan:multiChannel";
      }
    }
    
    return mostEfficientData;

  }

  render() {

    if (!this.props.campaignData.length) {
      return null;
    }

    const {funnelFirstObjective, campaignData, getItemCost} = this.props;

    const topContributorData = this.getTopContributorData(funnelFirstObjective, campaignData);
    const mostEfficientData = this.getMostEfficientData(funnelFirstObjective, campaignData, getItemCost);
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
          <TrendingCard funnelFirstObjective = {funnelFirstObjective} 
            data = {trendingData}/>
        </div>
      );
    }
    
    return null;
  }
}
export default CampaignCards;