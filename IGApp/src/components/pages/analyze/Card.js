import React from 'react';
import Component from 'components/Component';

import style from 'styles/analyze/card.css';

class Card extends Component {
  style = style;

  render() {
    const {label, title, background, icon} = this.props;
    
    return (
      <div className={this.classes.cardItem}>
        <div>
          <img className={this.classes.cardFeature} src={background}/>
          <div className={this.classes.cardType}>
              {title}
          </div>
          <div className={this.classes.cardAvatar} data-icon={icon}/>
          <div className={this.classes.cardName}>
              {label}
          </div>
          {this.props.children}
        </div>
      </div>
    );
  }
}
export default Card;

