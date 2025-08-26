import Image from "next/image";

import { cn, getTechLogos } from "@/lib/utils";

const DisplayTechIcons = async ({ techStack, className }: TechIconProps & { className?: string }) => {
  const techIcons = await getTechLogos(techStack);

  return (
    <div className="flex flex-row items-center">
      {techIcons.slice(0, 3).map(({ tech, url }, index) => (
        <div
          key={tech}
          className={cn(
            "relative group bg-white/10 rounded-full flex items-center justify-center border border-white/20",
            "size-8 sm:size-10",
            index >= 1 && "-ml-2"
          )}
        >
          <span className="tech-tooltip">{tech}</span>

          <Image
            src={url}
            alt={tech}
            width={100}
            height={100}
            className="size-4 sm:size-5 object-contain"
          />
        </div>
      ))}
    </div>
  );
};

export default DisplayTechIcons;
