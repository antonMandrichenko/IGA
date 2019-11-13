import React from 'react';
import PropTypes from 'prop-types';
import Component from 'components/Component';
import {compose} from 'components/utils/utils';
import {inject, observer} from 'mobx-react';
import style from 'styles/plan/budget-left-to-plan.css';
import {formatNumber} from 'components/utils/budget';

const enhance = compose(
  inject(({attributionStore}) => ({
    attributionStore
  })),
  observer
);

class BudgetLeftToPlan extends Component {

  style = style;

  static propTypes = {
    annualBudget: PropTypes.number,
    annualBudgetLeftToPlan: PropTypes.number
  };

  render() {
    const {annualBudget, annualBudgetLeftToPlan} = this.props;
    const totalWidth = 216;

    const lineWidth = Math.round(totalWidth *
      (1 - (annualBudgetLeftToPlan >= 0 ? annualBudgetLeftToPlan / annualBudget : 0)));

    return <div>
      <div className={this.classes.upperText}>
        Annual Budget
      </div>
      <div className={this.classes.center}>
        <div className={this.classes.number}>
          {formatNumber(annualBudget)}
        </div>
        <div className={this.classes.dollar}>
          {this.props.attributionStore.currentCurrency.sign}
        </div>
      </div>
      <div className={this.classes.line}>
        <div className={this.classes.lineFill} style={{width: `${lineWidth}px`}}/>
      </div>
      <div className={this.classes.bottomText}>
        {this.props.attributionStore.currentCurrency.sign}{formatNumber(annualBudgetLeftToPlan)} left to plan
      </div>
    </div>;
  }

}

export default enhance(BudgetLeftToPlan)