import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import '../App.css';
import './Analytics.css';

const SkeletonCard = () => (
  <div className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl h-24 w-full border border-[var(--border)]"></div>
);

const SkeletonChart = () => (
  <div className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl h-72 w-full border border-[var(--border)] mt-4"></div>
);

const mockData = {
  totalClicks: 1428,
  clicksOverTime: {
    '7d': [
      { date: 'Mon', clicks: 120 },
      { date: 'Tue', clicks: 230 },
      { date: 'Wed', clicks: 180 },
      { date: 'Thu', clicks: 290 },
      { date: 'Fri', clicks: 210 },
      { date: 'Sat', clicks: 140 },
      { date: 'Sun', clicks: 258 }
    ],
    '30d': [
      { date: 'Week 1', clicks: 820 },
      { date: 'Week 2', clicks: 930 },
      { date: 'Week 3', clicks: 780 },
      { date: 'Week 4', clicks: 1050 }
    ],
    'all': [
      { date: 'Jan', clicks: 2100 },
      { date: 'Feb', clicks: 3400 },
      { date: 'Mar', clicks: 1428 }
    ]
  },
  referrers: [
    { source: 'Twitter', count: 540, percent: 38 },
    { source: 'Direct', count: 420, percent: 29 },
    { source: 'LinkedIn', count: 280, percent: 20 },
    { source: 'GitHub', count: 188, percent: 13 }
  ],
  devices: [
    { name: 'Mobile', value: 65, color: '#aa3bff' },
    { name: 'Desktop', value: 30, color: '#ff8a00' },
    { name: 'Tablet', value: 5, color: '#10b981' }
  ]
};

export default function Analytics() {
  const { shortCode } = useParams();
  const [dateRange, setDateRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [shortCode]);

  const chartData = useMemo(() => mockData.clicksOverTime[dateRange], [dateRange]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label} : ${payload[0].value} clicks`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-container fade-in">
      <header className="analytics-header">
        <Link to="/" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Home
        </Link>
        <div className="title-section">
          <h1>Analytics Overview</h1>
          <p className="subtitle">shrt.lnk/<span>{shortCode}</span></p>
        </div>
        
        {isLoading ? (
          <div className="metric-cards flex items-end gap-5 mb-10 w-full flex-wrap">
            <div className="flex-1 min-w-[200px]"><SkeletonCard /></div>
            <div className="flex-1 min-w-[200px]"><SkeletonCard /></div>
          </div>
        ) : (
          <div className="metric-cards">
            <div className="metric-card">
              <h3>Total Clicks</h3>
              <div className="metric-value">{mockData.totalClicks.toLocaleString()}</div>
            </div>
            
            <div className="filter-card">
              <label htmlFor="range">Date Range</label>
              <select 
                id="range" 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="range-select"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        )}
      </header>

      <main className="analytics-grid">
        <div className="chart-card span-2">
          <h2>Clicks Over Time</h2>
          {isLoading ? <SkeletonChart /> : (
            <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text)" tick={{ fill: 'var(--text)' }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text)" tick={{ fill: 'var(--text)' }} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 2 }} />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="var(--accent)" 
                  strokeWidth={4}
                  dot={{ r: 4, fill: 'var(--bg)', stroke: 'var(--accent)', strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--bg)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          )}
        </div>

        <div className="chart-card">
          <h2>Top Referrers</h2>
          {isLoading ? <SkeletonChart /> : (
          <ul className="referrers-list mt-4">
            {mockData.referrers.map((ref, idx) => (
              <li key={idx} className="referrer-item">
                <div className="referrer-info">
                  <span className="referrer-name">{ref.source}</span>
                  <span className="referrer-count">{ref.count} clicks</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${ref.percent}%` }}></div>
                </div>
              </li>
            ))}
          </ul>
          )}
        </div>

        <div className="chart-card">
          <h2>Device Breakdown</h2>
          {isLoading ? <SkeletonChart /> : (
          <>
            <div className="pie-wrapper mt-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                  data={mockData.devices}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {mockData.devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-h)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            </div>
            <div className="legend-custom">
              {mockData.devices.map((device, idx) => (
                <div key={idx} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: device.color }}></span>
                  <span className="legend-label">{device.name} ({device.value}%)</span>
                </div>
              ))}
            </div>
          </>
          )}
        </div>
      </main>
    </div>
  );
}
