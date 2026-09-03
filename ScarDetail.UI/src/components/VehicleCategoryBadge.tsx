import React from 'react';
import type { VehicleCategory } from '../types';

export const VehicleCategoryBadge: React.FC<{ category: VehicleCategory }> = ({ category }) => {
  const displayNames: Record<VehicleCategory, string> = {
    Hatch: 'Hatch',
    Sedan: 'Sedan',
    SUV: 'SUV',
    Camionete: 'Camionete',
    Wagon: 'Wagon (Perua)',
  };

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-brand-300 border border-slate-700">
      {displayNames[category] || category}
    </span>
  );
};
