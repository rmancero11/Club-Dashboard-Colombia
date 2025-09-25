import { cn } from "@/app/lib/utils";

interface Props {
  strength: 0 | 1 | 2 | 3
}

const PasswordStrength = ({ strength }: Props) => (
  <div className="flex gap-2 mt-2">
    {Array.from({ length: strength + 1 }).map((_, idx) => (
      <div key={idx} className={cn("h-2 w-1/4 rounded-md", {
        "bg-red-500": strength === 0,
        "bg-orange-500": strength === 1,
        "bg-yellow-500": strength === 2,
        "bg-green-500": strength === 3
      })}>

      </div>

    ))
    }
  </div>
)

export default PasswordStrength
