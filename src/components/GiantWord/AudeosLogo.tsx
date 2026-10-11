import { AUDEOS_LOGO_PATH } from "@/components/GiantWord/audeosLogoPath";

export interface AudeosLogoProps {
  className?: string;
}

export default function AudeosLogo({ className }: AudeosLogoProps ) {
  return (
    <svg
      className={ className }
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1008 1010"
      fillRule="evenodd"
      role="img"
      aria-label="Audeos"
    >
      <path fill="currentColor" d={ AUDEOS_LOGO_PATH } />
    </svg>
  );
}
