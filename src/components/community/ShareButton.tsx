import React, { useState } from 'react';
import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  postId: string;
  title?: string;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ postId, title, className }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/community/${postId}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'Miyeon Community', url });
      } catch {
        // user cancelled the native share sheet — nothing more to do
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`relative flex items-center gap-1.5 text-xs font-semibold text-miyeon-main/70 hover:text-miyeon-main ${className ?? ''}`}
    >
      <Share2 className="h-4 w-4" />
      Share
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-miyeon-ink px-2.5 py-1 text-[10px] font-semibold text-white shadow-md">
          Link copied
        </span>
      )}
    </button>
  );
};
