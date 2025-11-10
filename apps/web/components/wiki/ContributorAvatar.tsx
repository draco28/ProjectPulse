import Image from 'next/image';

interface Contributor {
  name: string;
  avatar?: string;
  editCount: number;
  lastEditAt: string;
}

interface ContributorAvatarProps {
  contributor: Contributor;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: { wrapper: 'w-6 h-6', text: 'text-xs' },
  sm: { wrapper: 'w-8 h-8', text: 'text-sm' },
  md: { wrapper: 'w-10 h-10', text: 'text-base' },
  lg: { wrapper: 'w-12 h-12', text: 'text-lg' },
};

export function ContributorAvatar({
  contributor,
  size = 'sm',
  showTooltip = true
}: ContributorAvatarProps) {
  const { wrapper, text } = sizeClasses[size];
  const initials = generateInitials(contributor.name);

  const avatar = contributor.avatar ? (
    <Image
      src={contributor.avatar}
      alt={contributor.name}
      width={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : 48}
      height={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : 48}
      className="rounded-full"
    />
  ) : (
    <div
      className={`${wrapper} coral-gradient rounded-full flex items-center justify-center ${text} font-bold text-white shadow-lg`}
    >
      {initials}
    </div>
  );

  if (showTooltip) {
    return (
      <div className="relative group">
        {avatar}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-darkCard text-white text-xs rounded opacity-0 group-hover:opacity-100 smooth-transition whitespace-nowrap pointer-events-none z-10">
          {contributor.name}
        </div>
      </div>
    );
  }

  return avatar;
}

function generateInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return initials || 'U'; // Fallback to 'U' for "User"
}