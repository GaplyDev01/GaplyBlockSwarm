import * as React from "react"
import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "subtle" | "ghost" | "icon"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      isLoading = false,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    return (<Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          
          // Variant styles
          variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_10px_0_rgba(0,255,128,0.3)]",
          variant === "secondary" && "bg-secondary text-secondary-foreground border border-emerald-400/50 hover:border-emerald-400",
          variant === "outline" && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          variant === "subtle" && "bg-accent/50 text-accent-foreground hover:bg-accent/80",
          variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
          variant === "icon" && "rounded-full p-2 h-auto w-auto",
          
          // Size styles
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-8 px-3 py-1 text-sm",
          size === "lg" && "h-12 px-6 py-3 text-lg",
          size === "icon" && "h-10 w-10",
          
          className
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (    <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >    <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>    <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : null}
        {props.children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }