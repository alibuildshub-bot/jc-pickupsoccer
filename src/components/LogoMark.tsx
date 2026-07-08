export default function LogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  const boxSize = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const ballSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className={`relative flex ${boxSize} items-center justify-center overflow-hidden rounded-lg bg-[#171717] text-white shadow-sm`}>
      <div className="absolute inset-x-2 bottom-2 h-1/2 rounded-t-full border-2 border-[#7ed9a3] border-b-0" />
      <div className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 bg-white/20" />
      <div className={`relative ${ballSize} rounded-full border-2 border-white bg-white`}>
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#171717]/45" />
        <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#171717]/45" />
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#171717]" />
      </div>
    </div>
  );
}
