import type { SVGProps } from 'react';

export function TeachHubLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
      <path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 002-2v-5"></path>
      <path d="M6 10.5V17a2 2 0 002 2h8a2 2 0 002-2v-6.5"></path>
    </svg>
  );
}
