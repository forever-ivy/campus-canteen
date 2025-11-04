"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import {
  DialogStack,
  DialogStackBody,
  DialogStackContent,
  DialogStackDescription,
  DialogStackFooter,
  DialogStackHeader,
  DialogStackOverlay,
  DialogStackTitle,
  DialogStackTrigger,
} from "@/components/ui/shadcn-io/dialog-stack";
import { Button } from "@/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;

type ModalButtonRenderContext = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export interface ModalButtonProps {
  triggerText?: string;
  title: string;
  description?: React.ReactNode;
  children?:
    | React.ReactNode
    | ((context: ModalButtonRenderContext) => React.ReactNode);
  onConfirm?: () => Promise<void | boolean> | void | boolean;
  confirmText?: string;
  cancelText?: string;
  triggerProps?: ButtonProps;
  confirmProps?: ButtonProps;
  cancelProps?: ButtonProps;
  renderTrigger?: (context: ModalButtonRenderContext) => React.ReactNode;
  disableAutoClose?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ModalButton: React.FC<ModalButtonProps> = ({
  triggerText = "打开",
  title,
  description,
  children,
  onConfirm,
  confirmText = "确认",
  cancelText = "取消",
  triggerProps,
  confirmProps,
  cancelProps,
  renderTrigger,
  disableAutoClose = false,
  onOpenChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  const handleClose = React.useCallback(() => {
    setOpen(false);
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (!onConfirm) {
      if (!disableAutoClose) {
        handleClose();
      }
      return;
    }

    try {
      setSubmitting(true);
      const result = await onConfirm();
      if (disableAutoClose) {
        return;
      }
      if (result !== false) {
        handleClose();
      }
    } catch (err) {
      console.error("ModalButton confirm error:", err);
      // Keep dialog open for the caller to surface the error.
    } finally {
      setSubmitting(false);
    }
  }, [disableAutoClose, handleClose, onConfirm]);

  return (
    <DialogStack open={open} onOpenChange={setOpen}>
      <DialogStackTrigger asChild>
        {renderTrigger
          ? renderTrigger({ open, setOpen })
          : (
            <Button {...triggerProps}>
              {triggerText}
            </Button>
          )}
      </DialogStackTrigger>
      <DialogStackOverlay />
      <DialogStackBody>
        <DialogStackContent className="w-full max-w-lg">
          <DialogStackHeader>
            <DialogStackTitle>{title}</DialogStackTitle>
            {description ? (
              <DialogStackDescription>{description}</DialogStackDescription>
            ) : null}
          </DialogStackHeader>
          <div className="mt-4 space-y-4">
            {typeof children === "function"
              ? children({ open, setOpen })
              : children}
          </div>
          <DialogStackFooter className="justify-end">
            <Button
              variant="outline"
              {...cancelProps}
              onClick={(event) => {
                cancelProps?.onClick?.(event);
                handleClose();
              }}
              disabled={cancelProps?.disabled || submitting}
            >
              {cancelText}
            </Button>
            <Button
              {...confirmProps}
              onClick={async (event) => {
                if (confirmProps?.onClick) {
                  confirmProps.onClick(event);
                  if (event.defaultPrevented) return;
                }
                await handleConfirm();
              }}
              disabled={confirmProps?.disabled || submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {confirmText}
                </span>
              ) : (
                confirmText
              )}
            </Button>
          </DialogStackFooter>
        </DialogStackContent>
      </DialogStackBody>
    </DialogStack>
  );
};

export default ModalButton;
