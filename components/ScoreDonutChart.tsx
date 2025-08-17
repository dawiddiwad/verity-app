import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface ScoreDonutChartProps {
  score: number;
}

const ScoreDonutChart: React.FC<ScoreDonutChartProps> = ({ score }) => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);
  
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  const scoreColor = score >= 75 ? '#34c759' : score >= 50 ? '#ff9500' : '#ff3b30';
  const remainingColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const textColor = isDark ? '#FFFFFF' : '#1D1D1F';

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
          <Cell fill={remainingColor} />
           <Label
                value={`${score}%`}
                position="center"
                fill={textColor}
                className="text-2xl font-semibold"
            />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ScoreDonutChart;