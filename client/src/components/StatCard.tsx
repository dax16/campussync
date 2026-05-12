import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color }) => (
  <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <p className="stat-value">{value}</p>
    <p className="stat-label">{label}</p>
    {sub && <p className="stat-sub">{sub}</p>}
  </div>
);

export default StatCard;
