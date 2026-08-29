import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export default function AnalyticsChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center border border-hairline bg-surface-soft p-6 text-center text-xs tracking-wider text-muted-text rounded-none font-bmw-display font-bold uppercase">
        NO GRADED CREDITS DETECTED.
        <br />
        SELECT GRADES BELOW TO GENERATE DYNAMIC TRENDS.
      </div>
    );
  }

  return (
    <div className="w-full h-56 border border-hairline bg-surface-soft p-4 relative rounded-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: -5 }}>
          <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            stroke="#7e7e7e"
            fontSize={9}
            fontFamily="var(--font-mono)"
            tickLine={false}
          />
          <YAxis
            domain={[0, 4.0]}
            ticks={[0, 1.0, 2.0, 3.0, 4.0]}
            stroke="#7e7e7e"
            fontSize={9}
            fontFamily="var(--font-mono)"
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              borderColor: '#3c3c3c',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              borderRadius: '0px',
              borderWidth: '1px',
            }}
            labelStyle={{ color: '#7e7e7e', fontWeight: 'bold' }}
            cursor={{ stroke: '#3c3c3c', strokeWidth: 1 }}
          />
          <ReferenceLine
            y={3.7}
            stroke="#0066b1"
            strokeDasharray="4 4"
            label={{
              value: 'A- (3.7)',
              fill: '#0066b1',
              fontSize: 9,
              position: 'insideTopLeft',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <ReferenceLine
            y={2.0}
            stroke="#e22718"
            strokeDasharray="4 4"
            label={{
              value: 'C (2.0)',
              fill: '#e22718',
              fontSize: 9,
              position: 'insideTopLeft',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <Line
            type="monotone"
            dataKey="gpa"
            stroke="#1c69d4"
            strokeWidth={3}
            dot={{ r: 3.5, stroke: '#1c69d4', strokeWidth: 2, fill: '#000000' }}
            activeDot={{ r: 5, fill: '#e22718', stroke: '#ffffff', strokeWidth: 1 }}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
