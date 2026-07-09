import Image from "next/image";

export default function LogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  const boxSize = size === "sm" ? "h-8 w-8" : "h-12 w-12";
  const imageSize = size === "sm" ? 32 : 48;

  return (
    <Image
      src="/jc-footy-logo.png"
      alt="JC Footy logo"
      width={imageSize}
      height={imageSize}
      priority={size === "md"}
      className={`${boxSize} rounded-full object-cover shadow-sm`}
    />
  );
}
