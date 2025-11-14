'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp } from 'lucide-react';

interface TrendGraphProps {
  data: Array<{
    overallScore: number;
    calculatedAt: Date;
  }>;
}

/**
 * Display 30-day health score trend using Recharts
 * Line chart with coral gradient, tooltip, and stats summary
 */
export function TrendGraph({ data }: TrendGraphProps) {
  // Transform data for Recharts
  const chartData = data.map((item) => ({
    date: format(new Date(item.calculatedAt), 'MMM dd'),
    score: item.overallScore,
    fullDate: format(new Date(item.calculatedAt), 'PPP'),
  }));

  // Calculate stats
  const scores = chartData.map((d) => d.score);
  const highest = scores.length > 0 ? Math.max(...scores) : 0;
  const lowest = scores.length > 0 ? Math.min(...scores) : 0;
  const average = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0;

  return (
    <div className="neu-raised rounded-3xl p-6" data-testid="trend-graph">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-coral-400" />
        <h2 className="text-sm font-bold uppercase text-white">30-Day Trend</h2>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <div className="text-center">
            <TrendingUp className="mx-auto mb-3 h-12 w-12" />
            <p>Run multiple scans to see trend analysis</p>
          </div>
        </div>
      ) : (
        <>
          {/* Recharts Line Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                itemStyle={{ color: '#ffffff' }}
                formatter={(value: number) => [`Score: ${value}`, '']}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullDate;
                  }
                  return label;
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#ff6b6b"
                strokeWidth={3}
                dot={{ fill: '#ff6b6b', r: 4 }}
                activeDot={{ r: 6, fill: '#ff6b6b' }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Stats Summary */}
          <div className="mt-4 flex justify-around border-t border-white/10 pt-4">
            <div className="text-center">
              <div className="text-xs text-slate-400">Highest</div>
              <div className="text-lg font-bold text-green-400">{highest}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Lowest</div>
              <div className="text-lg font-bold text-red-400">{lowest}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Average</div>
              <div className="text-lg font-bold text-white">{average}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
