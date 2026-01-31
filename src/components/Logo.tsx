import Image from "next/image";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "default" | "white";
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, variant = "default", size = "md" }: LogoProps) {
  const isWhite = variant === "white";

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  // Use BW logo for white variant (for dark backgrounds)
  const logoSrc = isWhite
    ? "/images/logos/Logo BW.png"
    : "/images/logos/Logo Official.png";

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Image
        src={logoSrc}
        alt="Mahjic"
        width={48}
        height={48}
        className={`${sizeClasses[size]} object-contain`}
        priority
      />
      {showText && (
        <span className={`font-display font-semibold whitespace-nowrap ${textSizeClasses[size]} ${isWhite ? "text-white" : "text-green-deep"}`}>
          Mahjic
        </span>
      )}
    </div>
  );
}
