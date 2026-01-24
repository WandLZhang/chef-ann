/**
 * @file LeafIcon.tsx
 * @brief Custom leaf SVG icon component - matches favicon
 */

interface LeafIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function LeafIcon({ 
  size = 48, 
  color = 'rgba(76, 175, 80, 0.8)',
  className 
}: LeafIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.97C7.14 19.12 8.14 18.2 9.14 17.45C8.24 18.74 8 20 8 22H10C10 20 10.15 18.43 10.89 16.91C11.95 18.38 13.11 19.59 14 20.88L15.75 19.71C14.77 18.28 13.58 17.03 12.5 15.58C14.23 15.16 15.69 14.5 17 14V8Z"
        fill={color}
      />
      <path
        d="M17 8C17 8 20 5 22 3C19.5 4 17 5 17 8Z"
        fill={color}
        opacity="0.7"
      />
    </svg>
  );
}
