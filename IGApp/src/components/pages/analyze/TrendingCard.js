import React from 'react';
import Component from 'components/Component';
import NumberWithArrow from 'components/NumberWithArrow';

import style from 'styles/analyze/card.css';

class TrendingCard extends Component {
  style = style;

  render() {
    const {funnelFirstObjective, data, title} = this.props;
  
    if (!data) {
      return null;
    }
    
    return (
      <div className={this.classes.card}>
        <div className={this.classes.cardItem}>
          <div>
            <img className={this.classes.cardFeature} src={data.background}/>
            <div className={this.classes.cardType}>
                {title}
            </div>
            <div className={this.classes.cardAvatar} data-icon={data.icon}/>
            <div className={this.classes.cardName}>
                {data.label}
            </div>
            <div className={this.classes.cardContent}>
                {data.content[0]} <span> {data.content[1]} </span>
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
          </div>
        </div>
      </div>
    );
  }
}
export default TrendingCard;