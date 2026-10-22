import nodemailer from "nodemailer";
import { AppError } from "../../errors/errors.js";

export const assertEmailDeliveryConfigured = () => {
    const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"];
    const missing = required.filter((name) => !process.env[name]?.trim());
    const invalidPort = !/^\d+$/.test(process.env.SMTP_PORT ?? "")
        || Number(process.env.SMTP_PORT) < 1
        || Number(process.env.SMTP_PORT) > 65535;
    if (missing.length || !process.env.EMAIL_FROM?.trim() || invalidPort) {
        throw AppError("Email verification is not configured", 503);
    }
};

export const sendVerificationEmail = async (email, token) => {
    assertEmailDeliveryConfigured();

    const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000
    });

    const verificationUrl = new URL("/auth/verify-email", process.env.CLIENT_URL);
    verificationUrl.searchParams.set("token", token);

    try {
        await transport.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Verify your email address",
            text: `Open this link to verify your email address. It expires in 24 hours:\n\n${verificationUrl}`,
            html: `<p>Open this link to verify your email address. It expires in 24 hours.</p><p><a href="${verificationUrl}">Verify email</a></p>`
        });
    } catch {
        throw AppError("Could not send verification email. Please request another email.", 503);
    } finally {
        transport.close();
    }
};
