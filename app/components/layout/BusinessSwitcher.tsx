import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";

import { cn } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/Command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/Popover";
import { Business } from "@/app/types/business";
import { formatStringToSlug } from "@/app/helpers/strings.helpers";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ComponentPropsWithoutRef, useEffect, useState } from "react";

const generateBranchData = (
  branch: Business
): { label: string; value: string } => {
  return {
    label: branch.name,
    value: formatStringToSlug(branch.name),
  };
};

type PopoverTriggerProps = ComponentPropsWithoutRef<typeof PopoverTrigger>;

interface BusinessSwitcherProps extends PopoverTriggerProps {
  businessData?: Business | null;
}

export default function BusinessSwitcher({
  className,
  businessData,
}: BusinessSwitcherProps) {
  const isDsc = businessData?.parentId === "dsc-solutions";
  const branches = businessData?.sucursales?.map(generateBranchData) || [];
  const allLabel = isDsc ? "All" : "Todas";
  const groups = [
    {
      label: isDsc ? "Parent" : "Matriz",
      teams: [
        {
          label: businessData?.name,
          value: "matriz",
        },
      ],
    },
    {
      label: isDsc ? "Branches" : "Sucursales",
      teams: [{ label: allLabel, value: "todas" }, ...branches],
    },
  ];
  type Business = (typeof groups)[number]["teams"][number];
  const [open, setOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Business>({
    label:
      businessData?.parentId === "dsc-solutions"
        ? allLabel
        : businessData?.name,
    value: businessData?.parentId === "dsc-solutions" ? "todas" : "matriz",
  });
  const searchParams = useSearchParams();
  const slugBusinessName = formatStringToSlug(businessData?.name);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const { value } = selectedTeam;
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const isMatriz = value === "matriz";
    if (isMatriz) {
      current.delete("sucursal");
      current.set("matriz", slugBusinessName);
    } else {
      current.set("sucursal", selectedTeam.value);
    }
    const search = current.toString();
    const query = search ? `?${search}` : "";

    router.push(`${pathname}${query}`);
  }, [selectedTeam, searchParams, slugBusinessName, router, pathname]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a team"
          className={cn("justify-between w-full", className)}
        >
          <span className="truncate">{selectedTeam.label}</span>
          <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 z-50">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search team..." />
            <CommandEmpty>No team found.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.teams.map((team) => (
                  <CommandItem
                    key={team.value}
                    onSelect={() => {
                      setSelectedTeam(team);
                      setOpen(false);
                    }}
                    className="text-sm"
                  >
                    {team.label}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedTeam.value === team.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
