"use client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const Transcaation = () => {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast("Event has been created", {
          description: "Sunday, December 03, 2023 at 9:00 AM",
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
          classNames: {
            description: "!text-foreground/80",
          },
        })
      }
    >
      Show Toast
    </Button>
  );
};

export default Transcaation;
