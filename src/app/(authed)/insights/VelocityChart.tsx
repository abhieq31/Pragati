'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function VelocityChart({ data }: { data: { label: string; completed: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={28}>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          formatter={(v: any) => [`${v} tasks`, 'Completed']}
        />
        <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
          {data.map((_entry, i) => (
            <Cell key={i} fill={i === data.length - 1 ? '#1565C0' : '#BBDEFB'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}