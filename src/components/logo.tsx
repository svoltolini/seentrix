import Image from "next/image";

export function Logo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="Seentrix"
      width={size}
      height={size}
      className={className ?? "shrink-0"}
    />
  );
}
