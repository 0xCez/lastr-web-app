import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface ResponsiveModalContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface ResponsiveModalCloseProps {
  children: React.ReactNode;
  asChild?: boolean;
}

// Context to share mobile state with child components
const ResponsiveModalContext = React.createContext<{ isMobile: boolean }>({
  isMobile: false,
});

const useResponsiveModalContext = () => React.useContext(ResponsiveModalContext);

/**
 * ResponsiveModal - Automatically uses Drawer on mobile, Dialog on desktop
 *
 * Usage:
 * ```tsx
 * <ResponsiveModal open={open} onOpenChange={setOpen}>
 *   <ResponsiveModalTrigger asChild>
 *     <Button>Open</Button>
 *   </ResponsiveModalTrigger>
 *   <ResponsiveModalContent>
 *     <ResponsiveModalHeader>
 *       <ResponsiveModalTitle>Title</ResponsiveModalTitle>
 *       <ResponsiveModalDescription>Description</ResponsiveModalDescription>
 *     </ResponsiveModalHeader>
 *     <div>Content here</div>
 *     <ResponsiveModalFooter>
 *       <Button>Action</Button>
 *     </ResponsiveModalFooter>
 *   </ResponsiveModalContent>
 * </ResponsiveModal>
 * ```
 */
const ResponsiveModal = ({ open, onOpenChange, children }: ResponsiveModalProps) => {
  const isMobile = useIsMobile();

  return (
    <ResponsiveModalContext.Provider value={{ isMobile }}>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      )}
    </ResponsiveModalContext.Provider>
  );
};

const ResponsiveModalTrigger = ({ children, asChild }: ResponsiveModalTriggerProps) => {
  const { isMobile } = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerTrigger asChild={asChild}>{children}</DrawerTrigger>;
  }
  return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
};

const ResponsiveModalContent = ({ children, className }: ResponsiveModalContentProps) => {
  const { isMobile } = useResponsiveModalContext();

  if (isMobile) {
    return (
      <DrawerContent className={cn("max-h-[90vh]", className)}>
        <div className="overflow-y-auto max-h-[calc(90vh-2rem)] px-4 pb-4">
          {children}
        </div>
      </DrawerContent>
    );
  }
  return <DialogContent className={className}>{children}</DialogContent>;
};

const ResponsiveModalHeader = ({ children, className }: ResponsiveModalHeaderProps) => {
  const { isMobile } = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerHeader className={className}>{children}</DrawerHeader>;
  }
  return <DialogHeader className={className}>{children}</DialogHeader>;
};

const ResponsiveModalFooter = ({ children, className }: ResponsiveModalFooterProps) => {
  const { isMobile } = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerFooter className={className}>{children}</DrawerFooter>;
  }
  return <DialogFooter className={className}>{children}</DialogFooter>;
};

const ResponsiveModalTitle = ({ children, className }: ResponsiveModalTitleProps) => {
  const { isMobile } = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>;
  }
  return <DialogTitle className={className}>{children}</DialogTitle>;
};

const ResponsiveModalDescription = ({ children, className }: ResponsiveModalDescriptionProps) => {
  const { isMobile } = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerDescription className={className}>{children}</DrawerDescription>;
  }
  return <DialogDescription className={className}>{children}</DialogDescription>;
};

const ResponsiveModalClose = ({ children, asChild }: ResponsiveModalCloseProps) => {
  const { isMobile } = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerClose asChild={asChild}>{children}</DrawerClose>;
  }
  return <DialogClose asChild={asChild}>{children}</DialogClose>;
};

export {
  ResponsiveModal,
  ResponsiveModalTrigger,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalFooter,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalClose,
};
