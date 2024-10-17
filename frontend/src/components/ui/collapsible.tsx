"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

interface CollapsibleProps extends CollapsiblePrimitive.CollapsibleProps {
  className?: string;
  children: React.ReactNode;
}

export function Collapsible({
  className,
  children,
  ...props
}: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root className={className} {...props}>
      {children}
    </CollapsiblePrimitive.Root>
  );
}

export const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(({ children, className, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger ref={ref} className={className} {...props}>
    {children}
  </CollapsiblePrimitive.Trigger>
));
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ children, className, ...props }, ref) => (
  <CollapsiblePrimitive.Content ref={ref} className={className} {...props}>
    {children}
  </CollapsiblePrimitive.Content>
));
CollapsibleContent.displayName = "CollapsibleContent";
