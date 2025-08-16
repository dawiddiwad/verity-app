import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface ScoreDonutChartProps {
  score: number;
}

const ScoreDonutChart: React.FC<ScoreDonutChartProps> = ({ score }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="90%"
          outerRadius="100%"
          fill="#8884d8"
          paddingAngle={0}
          dataKey="value"
          stroke="none"
        >
          <Cell fill={scoreColor} />
          <Cell fill="#334155" />
           <Label
                value={`${score}%`}
                position="center"
                fill="#f1f5f9"
                className="text-2xl font-bold"
            />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ScoreDonutChart;