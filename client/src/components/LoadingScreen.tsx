import React from 'react';

interface LoadingScreenProps {
  height?: string | number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ height = '100vh' }) => (
  <div className="loading-screen" style={{ height }}>
    <div className="spinner" />
  </div>
);

export default LoadingScreen;
