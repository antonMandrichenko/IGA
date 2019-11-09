import React from 'react';
import PropTypes from 'prop-types';
import {sumBy, sum, orderBy, omit, transform, find} from 'lodash';
import classnames from 'classnames';
import memoize from 'memoize-one';
import {getColor, hexToRgb} from 'components/utils/colors';
import Component from 'components/Component';
import {
  getNickname
} from 'components/utils/indicators';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Sector,
  Cell,
  BarChart,
  Bar,
  Brush,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import Tooltip from 'components/controls/Tooltip';
import style from 'styles/analyze/generated-impact.css';
import analyzeStyle from 'styles/analyze/analyze.css';
import {formatNumber} from 'components/utils/budget';
import { compose } from 'components/utils/utils';
import { inject } from 'mobx-react';

const MIN_PERCENT_VALUE = 0.01 // if value of item < 0.01, group it to others
const MAX_COLUMNS_WITHOUT_BRUSH = 31
const enhance = compose(
  inject(({
    attributionStore: {
      conversionIndicator
    }
  }, nextProps) => ({
      indicator: nextProps.indicator || conversionIndicator
  }))
);
class GeneratedImpact extends Component {
  style = style;
  styles = [analyzeStyle];

  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    formatter: PropTypes.func,
    children: PropTypes.node,
    title: PropTypes.string,
    titleTooltip: PropTypes.string,
    valuesFormatter: PropTypes.func
  };

  static defaultProps = {
    formatter: item => item,
    valuesFormatter: item => item,
    title: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      activeIndex: undefined
    };
  }

  getPieShape = ({cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill}) => (
    <g>
      <defs>
        <filter id='pieShadow'>
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/>
          <feOffset in="blur" dx="0" dy="4" result="offsetBlur"/>
          <feFlood floodColor={fill} floodOpacity="0.3" result="offsetColor"/>
          <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur"/>
        </filter>
      </defs>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 3}
        outerRadius={outerRadius + 3}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        filter='url(#pieShadow)'
        cornerRadius={16}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 5}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill='#ffffff'
        cornerRadius={16}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 3}
        outerRadius={outerRadius + 3}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={16}
      />
    </g>
  );

  getBarShape = ({fill, x, y, width, height}) => {
    return height === 0 ? null : (
      <path
        d={`M ${x},${y + 2} h ${width} v ${height - 2} h -${width} Z`}
        stroke="none"
        fill={fill}
      />
    );
  };

  BarTooltip=(tooltipProps)=>{
    const chosenMetric = this.getMetricName();
    const { activeItemKey } = this.state;
    const { valuesFormatter } = this.props;
    const { payload } = tooltipProps;
    const activeItem = payload && payload.find(o => o.name === activeItemKey);
    if (!activeItem) {
      return null;
    }

    return (
      <div className={this.classes.impactChartTooltip}>
        <div className={this.classes.impactChartTooltipLabel}>
        <b>{chosenMetric}</b>: {activeItem.name}
        </div>
        <div className={this.classes.impactChartTooltipValue}>
          {formatNumber(valuesFormatter(activeItem.value))}
          <span>
            (
            {Math.round(
              (activeItem.value /
                payload.reduce((total, item) => total + item.value, 0)) *
                100
            )}
            %)
          </span>
        </div>
      </div>
    );
  }

  getData = memoize((rawData) => {
    const totalByKeysRaw = rawData.reduce((acc, dataItem) => {
      Object.keys(omit(dataItem, "name")).forEach((key) => {
        acc[key] = !acc[key]
          ? dataItem[key]
          : acc[key] + dataItem[key];
      });

      return acc;
    }, {});

    const total = sum(Object.values(totalByKeysRaw));

    const totalByKeys = Object.keys(totalByKeysRaw).reduce((acc, key) => {
      const value = totalByKeysRaw[key];

      // transform items that have value less than MIN_PERCENT_VALUE
      if (value / total <= MIN_PERCENT_VALUE) {
        acc.others = (acc.others || 0) + value;
      } else {
        acc[key] = value;
      }

      return acc;
    }, {});

    const optimizedData = rawData.map(dataItem =>
      transform(dataItem, (rs, value, key) => {
        if (key !== 'name' && !isNaN(value) && !totalByKeys[key]) {
          rs.others = (rs.others || 0) + value;
        } else {
          rs[key] = value;
        }
      }), {});

    const unorderedData = optimizedData.reduce((result, obj) => {
      Object.keys(obj).forEach(key => {
        if (key !== 'name') {
          const index = result.findIndex(item => item.name === key);

          if (index === -1) {
            result.push({
              name: key,
              value: obj[key]
            });
          } else {
            result[index].value += obj[key];
          }
        }
      });

      return result;
    }, []);

    const dataArray = orderBy(
      unorderedData,
      ['value', 'name'],
      ['desc', 'asc']
    );

    return {
      total,
      totalByKeys,
      dataArray,
      optimizedData,
    };
  });

  getMetricName = () => {
    const { indicator } = this.props;

    return getNickname(indicator);
  }
  render() {
    const chosenMetric = this.getMetricName();
    const {formatter, children, title, titleTooltip, valuesFormatter} = this.props;
    const {total, dataArray, optimizedData: data} = this.getData(this.props.data);

    return (
      <div className={analyzeStyle.locals.item}>
        <div className={classnames(analyzeStyle.locals.itemTitle, analyzeStyle.locals.withSelect)}>
          {titleTooltip ? (
            <Tooltip
              tip={titleTooltip}
              id='generatedImpact-title'
            >
              {title}
            </Tooltip>
          ) : title}
          {children}
        </div>
        <div className={classnames(analyzeStyle.locals.rows, this.classes.noMargin)}>
          <div className={classnames(analyzeStyle.locals.rows, this.classes.colLeft, this.classes.noMargin)}>
            <div className={this.classes.impactChartLegendContainer}>
              <div className={this.classes.impactChartLegend}>
                {
                  dataArray.map((item, i) => (
                    <div key={i} className={this.classes.impactChartLegendItem}>
                      <div
                        className={this.classes.impactChartLegendItemThumbnail}
                        style={{
                          backgroundColor: getColor(i),
                          boxShadow: this.state.activeIndex === i ? `0 4px 16px 0 rgba(${hexToRgb(getColor(i)).join(',')}, 0.3)` : 'none'
                        }}
                      />
                      <div
                        className={classnames(this.classes.impactChartLegendItemLabel, this.state.activeIndex === i && this.classes.active)}>
                        {`${item.name.toLowerCase()} — ${formatNumber(valuesFormatter(item.value))} `}
                        {Boolean(total) && (
                          <Tooltip
                            style={{display: 'inline', fontSize: '14px', fontWeight: '600', width: '30px'}}
                            tip={formatter(item.value)}
                            id='generatedImpact-id'
                          >
                            <span>({Math.round(item.value / total * 100)}%)</span>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            <div className={this.classes.impactPieChart}>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={dataArray}
                    dataKey="value"
                    cx='50%'
                    cy='50%'
                    labelLine={true}
                    innerRadius={'82%'}
                    outerRadius={'90%'}
                    isAnimationActive={false}
                    activeIndex={this.state.activeIndex}
                    activeShape={this.getPieShape}
                    onMouseEnter={(d, i) => {
                      this.setState({activeIndex: i});
                    }}
                    onMouseLeave={() => {
                      this.setState({activeIndex: undefined});
                    }}
                  >
                    {dataArray.map((entry, index) => <Cell fill={getColor(index)} key={index}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className={this.classes.impactPieChartTotal}>
                <p className={this.classes.impactPieChartMetric}>{formatNumber(valuesFormatter(total))}</p>
                <p className={this.classes.impactPieChartMetricName}>{chosenMetric}</p>
              </div>
            </div>
          </div>
          <div className={this.classes.colRight}>
            <div className={analyzeStyle.locals.analyzeChart}>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  className={this.classes.bar}
                  data={data}
                  barSize={16}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    stroke='rgba(54, 56, 64, 0.1)'
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tick={{fontSize: '12px', color: '#707ea7'}}
                    tickLine={false}
                    tickMargin={10}
                    height={40}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tick={{fontSize: '12px', color: '#707ea7'}}
                    tickLine={false}
                    tickMargin={15}
                    tickFormatter={v => formatter(v)}
                  />
                  {data.length > MAX_COLUMNS_WITHOUT_BRUSH && (
                    <Brush
                      dataKey="name"
                      height={40}
                      stroke="#3e7de3"
                      style={{marginTop: 10}}
                      startIndex={data.length - MAX_COLUMNS_WITHOUT_BRUSH}
                      endIndex={data.length - 1}
                    />
                  )}
                  {dataArray.map((item, index) =>
                    <Bar
                      key={index}
                      yAxisId="left"
                      dataKey={item.name}
                      stackId="channels"
                      fill={getColor(index)}
                      isAnimationActive={false}
                      shape={this.getBarShape}
                      onMouseEnter={() => {
                        this.setState({activeIndex: index, activeItemKey: item.name});
                      }}
                      onMouseLeave={() => {
                        this.setState({activeIndex: undefined, activeItemKey: undefined});
                      }}
                    />
                  )}
                  <RechartsTooltip
                    cursor={false}
                    offset={0}
                    content={this.BarTooltip}
                    animationDuration={500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default enhance(GeneratedImpact);

