import z from "zod";

// Enhanced signup input with more specific validation for username and name
export const signupInput = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"), // Username validation
    password: z.string().min(8, "Password must be at least 8 characters"), // Password length
    name: z.string().min(2, "Name must be at least 2 characters") // Minimum name length
});

// Enhanced signin input
export const signinInput = z.object({
    username: z.string().email("Invalid email format"), // Username as email
    password: z.string().min(8, "Password must be at least 8 characters") // Password length
});

// Create blog schema
export const createBlog = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"), // Minimum title length
    content: z.string().min(10, "Content must be at least 10 characters long") // Content length
});

// Update blog schema
export const updateBlog = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    content: z.string().min(10, "Content must be at least 10 characters long"),
    id: z.string().uuid("Invalid blog ID") // Ensure ID is a valid UUID
});

// Type inference for validation schemas
export type SignupInput = z.infer<typeof signupInput>;
export type SigninInput = z.infer<typeof signinInput>;
export type CreateBlog = z.infer<typeof createBlog>;
export type UpdateBlog = z.infer<typeof updateBlog>;
