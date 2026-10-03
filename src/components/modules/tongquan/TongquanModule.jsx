import React from 'react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { HomeAnalyticsChart } from '../home/HomeAnalyticsChart';
import { BarChart3, ArrowLeft } from 'lucide-react';

export function TongquanModule({ onNavigate }) {
  const { nhapData, xuatData, productData } = useData();
  const { usersData } = useAuth();

  return (
    <div className="space-y-4">
      {/* Analytics & Reporting Suite */}
      <HomeAnalyticsChart
        xuatData={xuatData}
        nhapData={nhapData}
        productData={productData}
        usersData={usersData}
        onNavigate={onNavigate}
      />
    </div>
  );
}
