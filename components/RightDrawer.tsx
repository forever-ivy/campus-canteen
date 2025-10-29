"use client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { IconButton } from "@/components/ui/shadcn-io/icon-button";
import { Bell } from "lucide-react";
// import { useState } from "react";
import useInfoStore from "../stores/infoStore";

export default function RightDrawer() {
  const { bellState, setBellState } = useInfoStore();
  return (
    <div className="flex flex-wrap gap-4">
      {/* Right drawer */}
      <Drawer direction="right" open={bellState} onOpenChange={setBellState}>
        <DrawerTrigger asChild>
          <IconButton
            active={bellState}
            icon={Bell}
            color={[239, 68, 68]}
            size="lg"
          />
        </DrawerTrigger>
        <DrawerContent>
          <div className="h-full w-full">
            <DrawerHeader>
              <DrawerTitle>Right Drawer</DrawerTitle>
              <DrawerDescription>
                This drawer slides in from the right.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Perfect for shopping carts or settings panels.
              </p>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button>Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
