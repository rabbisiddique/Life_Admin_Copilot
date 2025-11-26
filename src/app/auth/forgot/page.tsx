"use client";

import Logo from "@/components/logo/Logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
import { sendForgotPassLink } from "../../../../actions/user";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ForgotPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleForgotPassword = async (
    values: z.infer<typeof forgotPasswordSchema>
  ) => {
    setIsLoading(true);
    try {
      // ✅ Extract the email from the values object
      const res = await sendForgotPassLink(values.email);
      if (!res.success) {
        toast.error(res.message);
      } else {
        toast.success(res.message);
      }
      forgotPasswordForm.reset();
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };
  return (
    <>
      <motion.div
        key="forgot"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <Card className="border-primary/20 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-4 pb-8">
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <Logo />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <CardTitle className="text-2xl font-bold">
                Forgot password?
              </CardTitle>
              <CardDescription className="mt-2">
                No worries! Enter your email and we'll send you a verification
                code.
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <Form {...forgotPasswordForm}>
              <div className="space-y-6">
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="john@example.com"
                            className="pl-10 h-11"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  onClick={forgotPasswordForm.handleSubmit(
                    handleForgotPassword
                  )}
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending code..." : "Send Verification Code"}
                </Button>

                <Link
                  href={"/auth/login"}
                  className="w-full flex justify-center text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to login
                </Link>
              </div>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default ForgotPage;
