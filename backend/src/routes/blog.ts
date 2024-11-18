import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { createBlog, updateBlog } from "@rashmit49/medium-common";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  },
  Variables: {
    userId: string;
  }
}>();

// Middleware for authentication
blogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader; // Handle "Bearer" prefix

  try {
    const user = await verify(token, c.env.JWT_SECRET);
    c.set("userId", (user as { id: string }).id); // Safely cast user object
    await next();
  } catch (error) {
    console.error("Authentication error:", error);
    c.status(403);
    return c.json({
      message: "Authentication failed or token is invalid",
    });
  }
});

// Route to create a blog post
blogRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const authorId = c.get("userId");
    const {success} = createBlog.safeParse(body)

    if (!success) {
      c.status(411)
      return c.json({error: 'Invalid request body'})
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        author: body.author,
        authorId: authorId,
      },
    });

    return c.json({
      blogId: blog.id,
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return c.json({ message: "Failed to create blog post" }, 500);
  }
});

// Route to update a blog post
blogRouter.put("/", async (c) => {
  try {
    const body = await c.req.json();
    const {success} = updateBlog.safeParse(body)

    if (!success) {
      c.status(411)
      return c.json({error: 'Invalid request body'})
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog = await prisma.post.update({
      where: {
        id: body.id,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });

    return c.json({
      id: blog.id,
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return c.json({ message: "Failed to update blog post" }, 500);
  }
});

// Route to fetch all blog posts (bulk)
blogRouter.get("/bulk", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blogs = await prisma.post.findMany();
    return c.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return c.json({ message: "Failed to fetch blogs" }, 500);
  }
});

// Route to fetch a single blog post by ID
blogRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog = await prisma.post.findFirst({
      where: {
        id: id,
      },
    });

    if (!blog) {
      c.status(404);
      return c.json({ message: "Blog post not found" });
    }

    return c.json({ blog });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return c.json({ message: "Failed to fetch blog post" }, 500);
  }
});
