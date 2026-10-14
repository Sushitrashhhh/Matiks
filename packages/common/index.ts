import z from "zod";

export const registerSchema = z.object({
    email: z.string(),
    password: z.string().min(3, "Password is too short")
})

export const loginSchema = z.object({
    email: z.string(),
    password: z.string().min(3, "Password is too short")
})

export const zodErrorMessage = ({error}: {error: z.ZodError}) => {
    return error.issues.map((er) => `path:${er.input}, message:${er.message}`).join(", ");
}

