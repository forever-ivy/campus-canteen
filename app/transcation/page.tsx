"use client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CollapsibleInfo from "../../components/CollapsibleInfo";

const Transcaation = () => {
  return (
    <div>
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
      <CollapsibleInfo />
    </div>
  );
};

export default Transcaation;
