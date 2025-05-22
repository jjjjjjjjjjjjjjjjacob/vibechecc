import Link from "next/link"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface CreateVibeButtonProps extends ButtonProps {}

export function CreateVibeButton({ variant = "outline", ...props }: CreateVibeButtonProps) {
  return (
    <Button variant={variant} asChild {...props}>
      <Link href="/create">
        <Plus className="h-4 w-4 mr-2" />
        create vibe
      </Link>
    </Button>
  )
}
