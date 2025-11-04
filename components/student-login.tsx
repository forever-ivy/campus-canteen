/**
 * @description A React login form card with email/password inputs, social authentication button, and forgot password link for user authentication
 * @opening Authentication flows can make or break user experience. This React login card combines email/password inputs with social login options in a clean, contained interface. Built with shadcn/ui components and React state management, it includes all the essentials—password reset link, alternate authentication methods, and sign-up prompt. Perfect for authentication pages, modal logins, or onboarding flows where you need a complete login solution in one component.
 * @related [{"href":"/patterns/card-standard-1","title":"Standard Card","description":"Basic card with title, content, and actions"},{"href":"/patterns/card-standard-3","title":"Meeting Notes Card","description":"Card with content list and avatar footer"},{"href":"/patterns/card-standard-4","title":"Image Card","description":"Card with image and icon indicators"},{"href":"/patterns/dialog-standard-1","title":"Dialog Form","description":"Modal dialog with form inputs"},{"href":"/patterns/accordion-form-1","title":"Accordion Form","description":"Multi-step form using accordion sections"},{"href":"/patterns/sheet-standard-1","title":"Sheet Form","description":"Slide-out panel with form inputs"}]
 * @questions [{"id":"card-login-validation","title":"How do I add form validation to the login card?","answer":"Use React Hook Form with a validation library like Zod or Yup. Wrap the form inputs with the form controller, define validation rules for email format and password requirements, and display error messages below each input field. You can show validation errors on blur or submit, and disable the login button until the form is valid. For real-time validation, use the form's formState to check field errors and display helper text with destructive variant styling."},{"id":"card-login-social","title":"Can I add more social login options beyond Google?","answer":"Absolutely! Duplicate the Google button and update the text and icon for other providers like GitHub, Facebook, Twitter, or Apple. For proper OAuth integration, each button should trigger the corresponding provider's authentication flow. Consider using a library like NextAuth.js or Auth0 for handling multiple OAuth providers with consistent callback handling and session management."},{"id":"card-login-forgot-password","title":"How do I implement the forgot password functionality?","answer":"The forgot password link should trigger either a dialog with an email input or navigate to a dedicated password reset page. When users enter their email, send a password reset link to their inbox. Best practice is to show the same success message whether the email exists or not to prevent user enumeration attacks. Store the reset token with an expiration time and validate it when users click the link to set a new password."},{"id":"card-login-loading","title":"How do I show loading states during authentication?","answer":"Add a loading state to track the authentication request. When loading is true, disable form inputs and buttons, and replace button text with a spinner icon or loading text. Use the Button component's disabled prop and render a Loader2 icon with animate-spin class. For social login buttons, you can show separate loading states so users know which authentication method is in progress."},{"id":"card-login-errors","title":"How do I display authentication errors to users?","answer":"Create an error state to store authentication error messages. Display errors in an Alert component above the form or below the submit button using the destructive variant. Common errors include invalid credentials, account locked, unverified email, or server errors. Provide clear, actionable error messages like 'Invalid email or password' rather than technical error codes, and avoid revealing whether an email exists in your system."},{"id":"card-login-accessibility","title":"Is the login form accessible for keyboard and screen reader users?","answer":"Yes! The Input and Label components are properly associated with htmlFor and id attributes, so screen readers announce labels correctly. Users can tab through all interactive elements in logical order—email input, password input, forgot password link, login button, social button, and sign-up link. The form should also handle Enter key submission, and focus should move to the first error field when validation fails. Add aria-invalid and aria-describedby attributes to inputs with errors for better screen reader announcements."}]
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const title = "Login Card";

const Login = () => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/student/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: studentId.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "登录失败");
        setLoading(false);
        return;
      }

      // 登录成功，跳转到学生个人页面
      router.push(`/student/${studentId.trim()}`);
    } catch (err) {
      console.error("登录错误:", err);
      setError("网络错误，请稍后重试");
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
        <CardTitle>登录你的账户</CardTitle>
        <CardDescription>输入你的学号和密码</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="studentId">学号</Label>
            <Input
              id="studentId"
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="202411030101"
              type="text"
              value={studentId}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">密码</Label>
            </div>
            <Input
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              value={password}
              placeholder="ysu030101"
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex justify-center">
        <p className="text-muted-foreground text-sm">
          燕山大学智慧食堂管理系统
        </p>
      </CardFooter>
    </Card>
  );
};

export default Login;
