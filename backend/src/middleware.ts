import { Hono } from "hono";
import { verify } from "hono/jwt";

// Define middleware function that attaches to Hono app
export function initMiddleware(app: Hono<{
  Bindings: {
    DATABASE_URL: string,
    JWT_SECRET: string
  }
}>) {
  app.use('/api/v1/blog/*', async (c, next) => {
    const header = c.req.header("authorization");

    // If no authorization header, return unauthorized
    if (!header) {
      c.status(403);
      return c.json({ error: "Unauthorized" });
    }

    try {
      // Remove "Bearer " prefix and trim whitespace from the token
      const token = header.replace("Bearer ", "").trim();

      // Verify the JWT token using JWT_SECRET binding
      const response = await verify(token, c.env.JWT_SECRET);

      // Proceed if the token is valid and contains an ID
      if (response && response.id) {
        return next();
      } else {
        // Unauthorized if verification fails or data is missing
        c.status(403);
        return c.json({ error: "Unauthorized" });
      }
    } catch (error) {
      // Catch and handle any verification errors
      c.status(403);
      return c.json({ error: "Unauthorized" });
    }
  });
}
