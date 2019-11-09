import React from 'react';
import Component from 'components/Component';
import NumberWithArrow from 'components/NumberWithArrow';
import Card from 'components/pages/analyze/Card';

import {precisionFormat} from 'utils';
import {
  getNickname as getIndicatorNickname
} from 'components/utils/indicators';

import style from 'styles/analyze/card.css';

class TopContributorCard extends Component {
  style = style;

  render() {
    const {funnelFirstObjective, data} = this.props;
    
    if (!data) {
      return null;
    }
    
    return (
      <div className={this.classes.card}>
        <Card title="Top Contributor" 
          label = {data.label}
          icon = {data.icon}
          background = {data.background}>
          <div className={this.classes.cardContent}>
              {precisionFormat(data.value)} <span> {getIndicatorNickname(funnelFirstObjective)} </span>
          </div>
          <div style={{display:'none'}} className={this.classes.cardStatus}> 
              <NumberWithArrow
              stat={"18.5%"}
              arrowStyle={{
                  alignSelf: 'center',
                  borderWidth: '0px 4px 5px 4px',
                  borderColor: 'transparent transparent #2fcf5f transparent',
              }}
              />
          </div>
          <div style={{display:'none'}} className={this.classes.cardComparison}>
              Compared to <span> 35.9 {funnelFirstObjective}s </span> in 1-Mar-19 to 31-Mar-19
          </div>
          <button style={{display:'none'}} className={this.classes.cardShowme}>
              Show Me
          </button>
        </Card>
      </div>
    );
  }
}
export default TopContributorCard;