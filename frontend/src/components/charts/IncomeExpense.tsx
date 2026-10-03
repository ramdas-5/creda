import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
export function IncomeExpense({ data }: { data: { month: string; income: number; expense: number }[] }) {
  if (!data?.length) return <p className="text-sm text-slate-500">No chart data yet — connect the backend to see income vs expense.</p>;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
