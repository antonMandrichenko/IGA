import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react';

import { formatNumberWithDecimalPoint } from 'components/utils/budget';
import { compose } from 'components/utils/utils';

import GeneratedImpact from 'components/pages/analyze/GeneratedImpact';
import Select from 'components/controls/Select';

import styles from 'styles/analyze/analyze.css';
import FrequencySelect from 'components/pages/analyze/FrequencySelect'

const classes = styles.locals;

const enhance = compose(
    inject(
        ({
            attributionStore: { metricsOptions },
            analyze: {
                overviewStore: { getCategoryData, marketingFrequency: { control }},
            },
        }) => {
            return {
                getCategoryData,
                metricsOptions,
                frequencyControl: control,
            };
        },
    ),
    observer,
);

class ImpactByMarketing extends Component {
    state = {
        indicator: 'SQL',
    };

    onIndicatorChange = ({ value: indicator }) => {
        this.setState({
            indicator,
        });
    };

    render() {
        const { getCategoryData, metricsOptions, frequencyControl } = this.props;
        const { indicator } = this.state;
        const data = getCategoryData(indicator);

        return (
            <div className={classes.rows}>
                <GeneratedImpact
                    data={data}
                    valuesFormatter={formatNumberWithDecimalPoint}
                    title="Marketing-Generated Business Impact"
                    indicator={indicator}
                >
                    <div className={classes.select}>
                        <div className={classes.selectLabel}>
                            Conversion goal
                        </div>
                        <Select
                            selected={indicator}
                            select={{
                                options: metricsOptions,
                            }}
                            onChange={this.onIndicatorChange}
                            style={{
                                width: '143px',
                                marginLeft: '10px',
                                marginRight: '15px',
                                fontWeight: 500,
                            }}
                        />
                        <FrequencySelect {...frequencyControl}/>
                    </div>
                </GeneratedImpact>
            </div>
        );
    }
}

ImpactByMarketing.defaultProps = {
    getCategoryData: () => [],
};

ImpactByMarketing.propTypes = {
    getCategoryData: PropTypes.func,
    metricsOptions: PropTypes.arrayOf(PropTypes.shape({})),
    frequencyControl: PropTypes.object.isRequired,
};

export default enhance(ImpactByMarketing);
