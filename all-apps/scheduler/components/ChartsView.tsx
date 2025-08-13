import React, { useState } from 'react';
import { ChartData } from '../types';
import LineChart from './LineChart';
import BarChart from './BarChart';

type ChartType = 'cost-s-curve' | 'resource-s-curve' | 'resource-distribution';

interface ChartsViewProps {
  data: ChartData;
}

const ChartsView: React.FC<ChartsViewProps> = ({ data }) => {
  const [activeChart, setActiveChart] = useState<ChartType>('cost-s-curve');

  const chartInfo = {
    'cost-s-curve': {
      title: 'Cumulative Cost (Cash Flow S-Curve)',
      yAxisLabel: 'Cumulative Cost (€)',
      data: data.costSCurve,
      component: LineChart,
      description: 'This chart shows the cumulative project cost over time, based on the package cost of completed activities each month.'
    },
    'resource-s-curve': {
      title: 'Cumulative Resource Loading (S-Curve)',
      yAxisLabel: 'Cumulative Number of Crews',
      data: data.resourceSCurve,
      component: LineChart,
      description: 'This chart shows the cumulative number of crews planned on-site each week throughout the project.'
    },
    'resource-distribution': {
      title: 'Weekly Resource Distribution',
      yAxisLabel: 'Number of Crews',
      data: data.resourceDistribution,
      component: BarChart,
      description: 'This histogram displays the number of crews planned on-site for each week, helping to visualize resource peaks and valleys.'
    }
  };
  
  const currentChart = chartInfo[activeChart];
  const ChartComponent = currentChart.component;

  const getButtonClass = (chartType: ChartType) => {
    return `px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
      activeChart === chartType
        ? 'bg-brand-accent text-brand-primary'
        : 'bg-brand-primary/50 text-brand-light hover:bg-brand-muted/20'
    }`;
  };

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <h3 className="text-xl font-bold text-brand-light">{currentChart.title}</h3>
        <div className="flex items-center bg-brand-primary p-1 rounded-lg text-sm flex-shrink-0">
          <button onClick={() => setActiveChart('cost-s-curve')} className={getButtonClass('cost-s-curve')}>
            Cost S-Curve
          </button>
          <button onClick={() => setActiveChart('resource-s-curve')} className={getButtonClass('resource-s-curve')}>
            Resource S-Curve
          </button>
          <button onClick={() => setActiveChart('resource-distribution')} className={getButtonClass('resource-distribution')}>
            Resource Histogram
          </button>
        </div>
      </div>
      <p className="text-sm text-brand-muted mb-6">{currentChart.description}</p>
      
      <div className="w-full h-80 md:h-96">
        {currentChart.data.length > 0 ? (
          <ChartComponent
            data={currentChart.data}
            yAxisLabel={currentChart.yAxisLabel}
          />
        ) : (
            <div className="flex items-center justify-center h-full text-brand-muted">
                <p>Not enough data to display this chart.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChartsView;