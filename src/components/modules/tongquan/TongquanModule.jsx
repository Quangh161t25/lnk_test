import React from 'react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { HomeAnalyticsChart } from '../home/HomeAnalyticsChart';
import { BarChart3, ArrowLeft } from 'lucide-react';

export function TongquanModule({ onNavigate }) {
  const { nhapData, xuatData, productData, fetchModule } = useData();
  const { usersData } = useAuth();

  // Lazy load reporting data when Tongquan is opened
  React.useEffect(() => {
    if (!nhapData || nhapData.length <= 1) fetchModule('nhap');
    if (!xuatData || xuatData.length <= 1) fetchModule('xuat');
    if (!productData || productData.length <= 1) fetchModule('sanpham');
  }, [nhapData, xuatData, productData, fetchModule]);

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
