"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function MerchantLogin() {
  const [merchantId, setMerchantId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/merchant/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchantId: merchantId.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("登录成功！");
        router.push(`/merchant/${merchantId.trim()}`);
      } else {
        toast.error(data.error || "登录失败");
      }
    } catch (err) {
      console.error("登录错误:", err);
      toast.error("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const Logo = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return (
      <img
        src="/ysu-logo.png"
        alt="YSU Logo"
        className="w-16 h-16"
        style={{
          filter:
            "brightness(0) saturate(100%) invert(20%) sepia(100%) saturate(3500%) hue-rotate(210deg) brightness(90%) contrast(105%)",
        }}
        {...props}
      />
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-center my-3">
          <Logo />
        </div>
        <CardTitle>商家登录</CardTitle>
        <CardDescription>请输入您的档口编号和密码</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merchantId">档口编号</Label>
            <Input
              id="merchantId"
              type="text"
              placeholder="例如: 01101"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="ysu + 档口编号"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
