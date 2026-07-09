import Image from "next/image";

export default function LogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  const boxSize = size === "sm" ? "h-10 w-10" : "h-15 w-15";
  const imageSize = size === "sm" ? 40 : 60;

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
