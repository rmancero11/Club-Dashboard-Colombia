import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";

interface ButtonSettingsProps {
  pathComponent: string;
}

export default function ButtonSettings({ pathComponent }: ButtonSettingsProps) {
  const IconsStyle = {
    color: "#3490dc",
  };

  const iconSize = "20px";

  return (
    <div className="bg-primary flex w-28 h-10 aling-center px-6 rounded-md justify-center">
      <Link href={pathComponent} className="flex items-center">
        <div className="bg-white rounded-xl mr-2">
          <IconPlus style={IconsStyle} size={iconSize} />
        </div>

        <h2 className="text-white font-bold">CREAR</h2>
      </Link>
    </div>
  );
}
