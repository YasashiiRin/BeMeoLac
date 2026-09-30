import React from 'react';

/**
 * "Thế giới": a small globe with a leaf sprouting from its rim and a tiny star, drawn like the
 * lucide icons beside it (24px grid, 2px round strokes, currentColor).
 */
export const WorldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {/* globe */}
    <circle cx="11" cy="13" r="8" />
    <path d="M3 13h16" />
    <path d="M11 5c-2.4 2.3-3.5 5-3.5 8s1.1 5.7 3.5 8c2.4-2.3 3.5-5 3.5-8s-1.1-5.7-3.5-8" />
    {/* leaf */}
    <path d="M15.6 6.6c.2-2.8 2.2-4.5 5.4-4.3.2 3.1-1.8 5-5.4 4.3Z" />
    <path d="M15.6 6.6 18.4 4" />
    {/* star */}
    <path d="M4 2.5v3M2.5 4h3" />
  </svg>
);
