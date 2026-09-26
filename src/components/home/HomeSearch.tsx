import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

/** Home search bar. Submitting hands the term to the map search via /map?q=. */
export const HomeSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/map?q=${encodeURIComponent(q)}` : '/map');
  };

  return (
    <form onSubmit={submit} className="bg-white px-5 pb-3 sm:hidden">
      <label className="flex items-center gap-2.5 rounded-full bg-miyeon-surface px-4 py-[13px]">
        <Search className="h-[18px] w-[18px] shrink-0 text-miyeon-main/60" strokeWidth={1.5} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search treatments, salons, clinics"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent text-[14px] text-miyeon-ink placeholder:text-miyeon-main/55 focus:outline-none"
        />
      </label>
    </form>
  );
};
