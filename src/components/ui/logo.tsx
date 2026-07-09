import Image from "next/image";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.jpeg"
      alt="Ka Sari-Sari"
      width={size}
      height={size}
      className={`rounded-xl object-cover shrink-0${className ? ` ${className}` : ""}`}
      priority
    />
  );
}
