import React, { useMemo, useState } from 'react';
import { Stats, WeightEntry, User, TimeRange } from '../types';
import { getBMICategory } from '../utils/calculations';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine 
} from 'recharts';
import { TrendingDown, TrendingUp, Minus, Activity, Target } from 'lucide-react';

interface Props {
  stats: Stats;
  entries: WeightEntry[];
  user: User;
  insights: string[];
}

export const Analytics: React.FC<Props> = ({ stats, entries, user, insights }) => {
  const [range, setRange] = useState<TimeRange>('30days');
  const bmiInfo = getBMICategory(stats.bmi);

  // Filter data for chart
  const chartData = useMemo(() => {
    const now = new Date();
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (range === 'all') return sorted;
    
    const days = range === '7days' ? 7 : 30;
    const cutoff = new Date(now.setDate(now.getDate() - days));
    return sorted.filter(e => new Date(e.date) >= cutoff);
  }, [entries, range]);

  const StatCard = ({ title, value, subtext, icon, colorClass }: any) => (
    <div className="flex flex-col rounded-xl bg-white p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase">{title}</span>
        <div className={`p-1.5 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Current" 
          value={`${stats.current} kg`} 
          subtext={stats.change !== 0 ? `${stats.change > 0 ? '+' : ''}${stats.change} kg total` : 'No change'}
          icon={<Activity size={16} className={stats.change <= 0 ? "text-teal-600" : "text-amber-600"} />}
          colorClass={stats.change <= 0 ? "text-teal-600" : "text-amber-600"}
        />
        <StatCard 
          title="BMI" 
          value={stats.bmi} 
          subtext={bmiInfo.label}
          icon={<Activity size={16} className={bmiInfo.color} />}
          colorClass={bmiInfo.color}
        />
        <StatCard 
          title="Avg Weekly" 
          value={`${stats.weeklyAvg} kg`}
          subtext="Last 7 days avg"
          icon={stats.weeklyAvg < 0 ? <TrendingDown size={16} className="text-teal-600"/> : <TrendingUp size={16} className="text-red-500"/>}
          colorClass={stats.weeklyAvg < 0 ? "text-teal-600" : "text-red-500"}
        />
        <StatCard 
          title="Goal" 
          value={user.target_weight ? `${user.target_weight} kg` : '-'}
          subtext={stats.goalProgress !== null ? `${Math.round(stats.goalProgress)}% complete` : 'Set a goal'}
          icon={<Target size={16} className="text-indigo-600"/>}
          colorClass="text-indigo-600"
        />
      </div>

      {/* Chart Section */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800">Progress History</h3>
          <div className="flex rounded-md bg-slate-100 p-1">
            {(['7days', '30days', 'all'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                  range === r ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r === '7days' ? '7 Days' : r === '30days' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                width={30}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                labelStyle={{ color: '#64748b', marginBottom: '0.25rem' }}
                formatter={(val: number) => [`${val} kg`, 'Weight']}
                labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              />
              {user.target_weight && (
                 <ReferenceLine y={user.target_weight} stroke="#6366f1" strokeDasharray="3 3" label={{ position: 'right', value: 'Goal', fill: '#6366f1', fontSize: 10 }} />
              )}
              <Line 
                type="monotone" 
                dataKey="weight_kg" 
                stroke="#0d9488" 
                strokeWidth={3} 
                dot={{ r: 3, fill: '#0d9488', strokeWidth: 0 }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI/Smart Insights */}
      {insights.length > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 border border-indigo-100">
          <h4 className="mb-3 text-sm font-bold text-indigo-900 uppercase flex items-center gap-2">
            <Activity size={16}/> Smart Insights
          </h4>
          <ul className="space-y-2">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-indigo-800">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};