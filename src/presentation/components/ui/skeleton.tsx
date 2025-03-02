import { cn } from "@/src/shared/utils/utils"
import React from "react"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Avatar component for consistent user representation
function Avatar({
  className,
  src,
  alt = "Avatar",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  alt?: string;
}) {
  return (    <div 
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-muted",
        className
      )}
      {...props}
    >
      {src ? (    <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (    <span className="text-xs">{alt.charAt(0).toUpperCase()}</span>
      )}
    </div>
  )
}

export { Skeleton, Avatar }