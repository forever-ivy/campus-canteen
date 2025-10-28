"use client";
import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
export default function DialogCustomClose() {
  return (
    <div className="w-full p-6 flex justify-center">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Open Modal</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            {/* <DialogTitle>Custom Close Button</DialogTitle>
            <DialogDescription>
              This dialog has a custom close button in the header.
            </DialogDescription> */}
          </DialogHeader>
          <DialogClose asChild>{/* add a button */}</DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
