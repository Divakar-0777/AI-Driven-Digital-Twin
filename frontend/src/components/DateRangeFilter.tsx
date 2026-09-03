import React from 'react';

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeFilterProps {
  value: string;
  onChange: (value: string) => void;
  onCustomRange?: (range: DateRange) => void;
  customStart?: string;
  customEnd?: string;
}

const presets = [
  { key: '7days', label: '7 Days', days: 7 },
  { key: '30days', label: '30 Days', days: 30 },
  { key: '3months', label: '3 Months', days: 90 },
  { key: '6months', label: '6 Months', days: 180 },
  { key: '1year', label: '1 Year', days: 365 },
  { key: 'custom', label: 'Custom', days: 0 },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  onCustomRange,
  customStart = '',
  customEnd = '',
}) => {
  const handleCustomDateChange = (field: 'start' | 'end', val: string) => {
    if (onCustomRange) {
      const start = field === 'start' ? val : customStart;
      const end = field === 'end' ? val : customEnd;
      if (start && end) {
        onCustomRange({ start: new Date(start), end: new Date(end) });
      }
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {presets.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
            background: value === p.key ? 'var(--primary)' : 'rgba(0,0,0,0.03)',
            color: value === p.key ? 'white' : 'var(--text-muted)',
            border: `1px solid ${value === p.key ? 'var(--primary)' : 'rgba(0,0,0,0.08)'}`,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {p.label}
        </button>
      ))}
      {value === 'custom' && (
        <>
          <input
            type="date"
            value={customStart}
            onChange={e => handleCustomDateChange('start', e.target.value)}
            style={{ width: 140, padding: '5px 8px', fontSize: '0.75rem' }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => handleCustomDateChange('end', e.target.value)}
            style={{ width: 140, padding: '5px 8px', fontSize: '0.75rem' }}
          />
        </>
      )}
    </div>
  );
};

export function getDateRange(filter: string): DateRange {
  const end = new Date();
  const start = new Date();
  const preset = presets.find(p => p.key === filter);
  if (preset && preset.days > 0) {
    start.setDate(start.getDate() - preset.days);
  } else {
    start.setFullYear(start.getFullYear() - 1);
  }
  return { start, end };
}

export default DateRangeFilter;
