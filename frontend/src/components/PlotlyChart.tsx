import React from 'react';
// @ts-ignore
import Plot from 'react-plotly.js';

export interface PlotlyChartProps {
  data: any[];
  layout?: any;
  config?: any;
  width?: number | string;
  height?: number;
  style?: React.CSSProperties;
}

const defaultLayout: any = {
  autosize: true,
  margin: { l: 50, r: 20, t: 30, b: 50 },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: 'Plus Jakarta Sans, system-ui, sans-serif', size: 12, color: '#64748b' },
  xaxis: {
    gridcolor: 'rgba(0,0,0,0.04)',
    zerolinecolor: 'rgba(0,0,0,0.06)',
    tickfont: { size: 10 },
  },
  yaxis: {
    gridcolor: 'rgba(0,0,0,0.04)',
    zerolinecolor: 'rgba(0,0,0,0.06)',
    tickfont: { size: 10 },
  },
  hoverlabel: {
    bgcolor: 'rgba(255,255,255,0.95)',
    bordercolor: 'rgba(79,70,229,0.2)',
    font: { family: 'Plus Jakarta Sans', size: 13, color: '#0f172a' },
  },
  legend: {
    orientation: 'h',
    y: -0.15,
    x: 0.5,
    xanchor: 'center',
    font: { size: 11 },
  },
};

const defaultConfig: any = {
  displayModeBar: true,
  modeBarButtonsToAdd: ['zoom2d', 'pan2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
  modeBarButtonsToRemove: ['lasso2d', 'select2d', 'toImage'],
  displaylogo: false,
  responsive: true,
  scrollZoom: true,
};

export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  data,
  layout = {},
  config = {},
  width,
  height = 300,
  style,
}) => {
  const mergedLayout = {
    ...defaultLayout,
    ...layout,
    width: width || undefined,
    height,
    xaxis: { ...defaultLayout.xaxis, ...(layout.xaxis || {}) },
    yaxis: { ...defaultLayout.yaxis, ...(layout.yaxis || {}) },
    hoverlabel: { ...defaultLayout.hoverlabel, ...(layout.hoverlabel || {}) },
    legend: { ...defaultLayout.legend, ...(layout.legend || {}) },
  };

  const mergedConfig = { ...defaultConfig, ...config };

  return (
    <div style={{ width: '100%', ...style }}>
      <Plot
        data={data}
        layout={mergedLayout}
        config={mergedConfig}
        style={{ width: '100%', height: `${height}px` }}
        useResizeHandler
      />
    </div>
  );
};

export default PlotlyChart;
