"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  AvatarGroup,
  AvatarGroupTooltip,
} from "@/components/ui/shadcn-io/avatar-group";
import { Flame } from "lucide-react";

const AVATARS = [
  {
    src: "https://pbs.twimg.com/profile_images/1909615404789506048/MTqvRsjo_400x400.jpg",
    fallback: "SK",
    tooltip: "Skyleen",
  },
  {
    src: "https://pbs.twimg.com/profile_images/1593304942210478080/TUYae5z7_400x400.jpg",
    fallback: "CN",
    tooltip: "Shadcn",
  },
  {
    src: "https://pbs.twimg.com/profile_images/1677042510839857154/Kq4tpySA_400x400.jpg",
    fallback: "AW",
    tooltip: "Adam Wathan",
  },
  {
    src: "https://pbs.twimg.com/profile_images/1783856060249595904/8TfcCN0r_400x400.jpg",
    fallback: "GR",
    tooltip: "Guillermo Rauch",
  },
  {
    src: "https://pbs.twimg.com/profile_images/1534700564810018816/anAuSfkp_400x400.jpg",
    fallback: "JH",
    tooltip: "Jhey",
  },
];

export const StoreLogo = () => {
  return (
    <Card className="p-8 flex">
      <div className=" flex  items-center ">
        <div className="flex mx-4">
          <div className="rounded-full bg-destructive p-2 mr-3">
            <Flame className="w-[36px] h-[36px] text-white" />
          </div>
          <h1 className="text-5xl font-bold text-destructive ">:</h1>
        </div>
        <AvatarGroup variant="motion" className="h-4 -space-x-3">
          {AVATARS.map((avatar, index) => (
            <Avatar key={index} className="size-12 border-3 border-background">
              <AvatarImage src={avatar.src} />
              <AvatarFallback>{avatar.fallback}</AvatarFallback>
              <AvatarGroupTooltip>
                <p>{avatar.tooltip}</p>
              </AvatarGroupTooltip>
            </Avatar>
          ))}
        </AvatarGroup>
      </div>
    </Card>
  );
};
export default StoreLogo;
