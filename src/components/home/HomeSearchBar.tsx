import React from 'react';
import { Search } from 'lucide-react';

export const HomeSearchBar: React.FC = () => (
  <div className="bg-white px-5 pb-3 sm:px-8">
    <div className="mx-auto flex max-w-3xl items-center gap-2.5 rounded-full bg-miyeon-surface px-4 py-3">
      <Search className="h-[18px] w-[18px] shrink-0 text-miyeon-main/55" strokeWidth={1.75} />
      <span className="text-sm text-miyeon-main/55">Search treatments, salons, clinics</span>
    </div>
  </div>
);
