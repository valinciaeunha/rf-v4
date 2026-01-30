"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function ForgotPasswordForm({ ...props }: React.ComponentProps<typeof Card>) {
    return (
        <Card {...props}>
            <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>
                    Enter your email to receive a password reset link.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </Field>
                        <FieldGroup>
                            <Field>
                                <Button type="submit" className="w-full">Send Reset Link</Button>
                                <FieldDescription className="text-center mt-2">
                                    Remember your password? <Link href="/login" className="underline underline-offset-4">Sign in</Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}
