/**
 * House iconography: 1.25 stroke, 24 grid, round caps. Never filled, never
 * coloured — they inherit `currentColor` from the element around them.
 *
 * Every icon takes the same props as an `<svg>`, so size comes from a class
 * (`className="h-4 w-4"`) exactly like in the design system.
 */
type IconProps = React.SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    "aria-hidden": true,
    ...props,
    className: props.className ?? "h-5 w-5",
  } as const;
}

export function BagIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7h14l1 13H4L5 7Z" />
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round">
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.5 20c1.3-3.6 4-5.4 7.5-5.4s6.2 1.8 7.5 5.4" />
    </svg>
  );
}

export function HeartIcon({
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(props)} fill={filled ? "currentColor" : "none"} strokeLinejoin="round">
      <path d="M12 20S3.5 14.8 3.5 9.4A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 8.5 2.2C20.5 14.8 12 20 12 20Z" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h16" />
      <path d="m14 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="m4.5 12.5 4.5 4.5 10.5-11" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5s-1.1 6.1-3.3 8.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5Z" />
    </svg>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.5h11v9h-11z" />
      <path d="M13.5 10h4l3 3v2.5h-7z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

/** The house mark — a crescent with a face. */
export function MoonIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.6 3.4a9 9 0 1 0 5 5A7 7 0 0 1 15.6 3.4Z" />
      <circle cx="10.2" cy="9.6" r=".9" fill="currentColor" stroke="none" />
      <path d="M8.4 13.2c1 1.1 2.3 1.5 3.6 1.1" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 6.5h15M9.5 6.5V4.8h5v1.7M6.5 6.5 7.4 20h9.2l.9-13.5" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="m12 3.5 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.9l6-.8z" />
    </svg>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinejoin="round">
      <path d="M12 3.2 20 7v10l-8 3.8L4 17V7l8-3.8Z" />
      <path d="M4 7l8 3.8L20 7M12 10.8V20.8" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z" />
    </svg>
  );
}

export function PenIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
      <path d="m14.5 5.5 4 4" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="17" height="17" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="16.8" cy="7.2" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round">
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinejoin="round">
      <rect x="4.5" y="10.5" width="15" height="9.5" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinejoin="round">
      <rect x="3.5" y="5.5" width="17" height="13" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinejoin="round">
      <rect x="8.5" y="8.5" width="11" height="11" />
      <path d="M15.5 5.5h-11v11" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" />
    </svg>
  );
}

export function RulerIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinejoin="round">
      <path d="M3 9.5h18v5H3z" />
      <path d="M7 9.5v2.5M11 9.5v3.5M15 9.5v2.5M19 9.5v3.5" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeWidth={1.5} strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeWidth={1.5} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 6l-6 6 6 6" />
    </svg>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeWidth={2} className={props.className ?? "h-3.5 w-3.5"}>
      <circle cx="12" cy="12" r="9" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
    </svg>
  );
}
