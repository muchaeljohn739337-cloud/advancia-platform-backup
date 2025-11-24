'use client';

import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';

// ✅ NIVO CHARTS EXAMPLE - Better than Chart.js
// Benefits: Beautiful, responsive, animated, TypeScript support

// Sample transaction data
const transactionData = [
  {
    id: 'deposits',
    color: 'hsl(152, 70%, 50%)',
    data: [
      { x: 'Jan', y: 45000 },
      { x: 'Feb', y: 52000 },
      { x: 'Mar', y: 48000 },
      { x: 'Apr', y: 61000 },
      { x: 'May', y: 58000 },
      { x: 'Jun', y: 72000 },
    ],
  },
  {
    id: 'withdrawals',
    color: 'hsl(348, 70%, 50%)',
    data: [
      { x: 'Jan', y: 38000 },
      { x: 'Feb', y: 42000 },
      { x: 'Mar', y: 39000 },
      { x: 'Apr', y: 48000 },
      { x: 'May', y: 45000 },
      { x: 'Jun', y: 55000 },
    ],
  },
];

const monthlyRevenue = [
  { month: 'Jan', revenue: 7000, fees: 350 },
  { month: 'Feb', revenue: 10000, fees: 500 },
  { month: 'Mar', revenue: 9000, fees: 450 },
  { month: 'Apr', revenue: 13000, fees: 650 },
  { month: 'May', revenue: 13000, fees: 650 },
  { month: 'Jun', revenue: 17000, fees: 850 },
];

const userDistribution = [
  { id: 'Premium', label: 'Premium', value: 320, color: 'hsl(220, 70%, 50%)' },
  {
    id: 'Standard',
    label: 'Standard',
    value: 850,
    color: 'hsl(152, 70%, 50%)',
  },
  { id: 'Basic', label: 'Basic', value: 1430, color: 'hsl(45, 70%, 50%)' },
];

export default function NivoChartsExample() {
  return (
    <div className="p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">📊 Nivo Charts Demo</h1>
        <div className="badge badge-secondary">Professional Financial Dashboards</div>
      </div>

      {/* Line Chart - Transaction Trends */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            📈 Transaction Trends (Line Chart)
            <div className="badge badge-primary">Real-time</div>
          </h2>
          <div className="h-96">
            <ResponsiveLine
              data={transactionData}
              margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{
                type: 'linear',
                min: 'auto',
                max: 'auto',
                stacked: false,
              }}
              curve="cardinal"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Month',
                legendOffset: 36,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Amount ($)',
                legendOffset: -40,
                legendPosition: 'middle',
                format: (value) => `$${value / 1000}k`,
              }}
              enableGridX={false}
              colors={{ scheme: 'set2' }}
              lineWidth={3}
              pointSize={10}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              enableArea={true}
              areaOpacity={0.1}
              useMesh={true}
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 100,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemDirection: 'left-to-right',
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: 'circle',
                },
              ]}
              animate={true}
              motionConfig="gentle"
            />
          </div>
          <div className="alert alert-info mt-4">
            <span>Smooth animations, responsive design, and beautiful gradients</span>
          </div>
        </div>
      </div>

      {/* Bar Chart - Monthly Revenue */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            💰 Monthly Revenue Breakdown (Bar Chart)
            <div className="badge badge-success">Growth +45%</div>
          </h2>
          <div className="h-96">
            <ResponsiveBar
              data={monthlyRevenue}
              keys={['revenue', 'fees']}
              indexBy="month"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              groupMode="grouped"
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={{ scheme: 'nivo' }}
              borderColor={{
                from: 'color',
                modifiers: [['darker', 1.6]],
              }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Month',
                legendPosition: 'middle',
                legendOffset: 32,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Revenue ($)',
                legendPosition: 'middle',
                legendOffset: -40,
                format: (value) => `$${value / 1000}k`,
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{
                from: 'color',
                modifiers: [['darker', 1.6]],
              }}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                },
              ]}
              animate={true}
              motionConfig="wobbly"
            />
          </div>
        </div>
      </div>

      {/* Pie Chart - User Distribution */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            👥 User Tier Distribution (Pie Chart)
            <div className="badge badge-accent">2,600 Total Users</div>
          </h2>
          <div className="h-96">
            <ResponsivePie
              data={userDistribution}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{
                from: 'color',
                modifiers: [['darker', 0.2]],
              }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{
                from: 'color',
                modifiers: [['darker', 2]],
              }}
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: '#999',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle',
                },
              ]}
              animate={true}
              motionConfig="gentle"
            />
          </div>
          <div className="stats shadow mt-4">
            <div className="stat">
              <div className="stat-title">Premium Users</div>
              <div className="stat-value text-primary">320</div>
              <div className="stat-desc">12.3% of total</div>
            </div>
            <div className="stat">
              <div className="stat-title">Standard Users</div>
              <div className="stat-value text-secondary">850</div>
              <div className="stat-desc">32.7% of total</div>
            </div>
            <div className="stat">
              <div className="stat-title">Basic Users</div>
              <div className="stat-value text-accent">1,430</div>
              <div className="stat-desc">55% of total</div>
            </div>
          </div>
        </div>
      </div>

      {/* DaisyUI Components Showcase */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">🎨 DaisyUI Components Gallery</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Buttons */}
            <div>
              <h3 className="font-semibold mb-2">Buttons</h3>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary">Primary</button>
                <button className="btn btn-secondary">Secondary</button>
                <button className="btn btn-accent">Accent</button>
                <button className="btn btn-ghost">Ghost</button>
                <button className="btn btn-outline">Outline</button>
              </div>
            </div>

            {/* Badges */}
            <div>
              <h3 className="font-semibold mb-2">Badges</h3>
              <div className="flex flex-wrap gap-2">
                <div className="badge badge-primary">Primary</div>
                <div className="badge badge-secondary">Secondary</div>
                <div className="badge badge-success">Success</div>
                <div className="badge badge-warning">Warning</div>
                <div className="badge badge-error">Error</div>
              </div>
            </div>

            {/* Alerts */}
            <div className="col-span-2">
              <h3 className="font-semibold mb-2">Alerts</h3>
              <div className="space-y-2">
                <div className="alert alert-info">
                  <span>New update available!</span>
                </div>
                <div className="alert alert-success">
                  <span>Transaction completed successfully</span>
                </div>
                <div className="alert alert-warning">
                  <span>Your balance is low</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
