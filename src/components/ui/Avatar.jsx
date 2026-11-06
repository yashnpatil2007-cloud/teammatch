import { useState } from 'react';
import { resolveFileUrl } from '../../services/api';
import { User as UserIcon } from 'lucide-react';

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-[13px]',
  lg: 'w-12 h-12 text-[15px]',
  xl: 'w-16 h-16 text-[18px]',
  '2xl': 'w-20 h-20 text-[22px]',
};

const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
  '2xl': 'w-9 h-9',
};

// Generates consistent initials from user name
function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Consistent colored gradient based on user name or ID
const GRADIENTS = [
  'from-indigo-500/15 to-purple-500/20 text-[#6C63FF]',
  'from-blue-500/15 to-cyan-500/20 text-blue-600',
  'from-emerald-500/15 to-teal-500/20 text-emerald-600',
  'from-amber-500/15 to-orange-500/20 text-amber-600',
  'from-rose-500/15 to-pink-500/20 text-rose-600',
  'from-violet-500/15 to-fuchsia-500/20 text-violet-600',
];

function getGradient(seed) {
  if (!seed) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function Avatar({ user, size = 'md', className = '', alt = '' }) {
  const [loadError, setLoadError] = useState(false);

  const rawPhoto = user?.profilePicture || user?.avatar || '';
  const photoUrl = resolveFileUrl(rawPhoto);
  const name = user?.name || '';
  const initials = getInitials(name);
  const sizeClass = SIZES[size] || SIZES.md;
  const iconSizeClass = ICON_SIZES[size] || ICON_SIZES.md;
  const gradientClass = getGradient(user?._id || name);

  // If there's a valid photo and it hasn't errored
  if (photoUrl && !loadError) {
    return (
      <img
        src={photoUrl}
        alt={alt || name || 'User profile'}
        onError={() => setLoadError(true)}
        className={`${sizeClass} rounded-full object-cover border border-[var(--border)] shrink-0 ${className}`}
      />
    );
  }

  // Fallback: initials or user icon
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${gradientClass} border border-[var(--border)] flex items-center justify-center font-extrabold select-none shrink-0 ${className}`}
      title={name || 'User'}
      aria-label={name || 'User avatar'}
    >
      {initials ? (
        <span>{initials}</span>
      ) : (
        <UserIcon className={`${iconSizeClass} opacity-70`} />
      )}
    </div>
  );
}

export default Avatar;
