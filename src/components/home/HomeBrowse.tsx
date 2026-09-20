import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { browseItems } from '../../data/home';

interface HomeBrowseProps {
  onStartAnalysis: () => void;
}

export const HomeBrowse: React.FC<HomeBrowseProps> = ({ onStartAnalysis }) => {
  const navigate = useNavigate();

  const handleClick = (id: (typeof browseItems)[number]['id']) => {
    if (id === 'treatments') onStartAnalysis();
    else if (id === 'salon') navigate('/map');
    else document.getElementById('at-home')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-miyeon-main/40">
          Or browse by
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3 md:gap-4">
          {browseItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              className={`group flex w-full items-center justify-between rounded-[1.4rem] border px-5 py-5 text-left transition-shadow hover:shadow-sm ${
                item.highlighted
                  ? 'border-transparent bg-miyeon-accent-soft/70'
                  : 'border-miyeon-line bg-white'
              }`}
            >
              <span>
                <span className="block text-[11px] font-medium text-miyeon-accent">{item.caption}</span>
                <span className="mt-1 block font-display text-xl text-miyeon-main">{item.title}</span>
                <span className="mt-1 block whitespace-pre-line text-sm text-miyeon-main/55">
                  {item.description}
                </span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-miyeon-main/30 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
