import { Hono } from 'hono';
import {userRouter} from './routes/user'; // Correct import path for userRouter
import {blogRouter} from './routes/blog'; // Ensure the correct path or comment it out if not implemented

// Create an instance of the Hono framework with type bindings for environment variables
const app = new Hono<{
  Bindings: {
    DATABASE_URL: string; // Environment variable for the database URL
    JWT_SECRET: string;   // Environment variable for JWT secret
  };
}>();

// Register routers for user and blog APIs
app.route("/api/v1/user", userRouter);
app.route("/api/v1/blog", blogRouter);

// Basic route to check server functionality
app.get('/', (c) => {
  return c.text('Hello Hono!');
});

export default app;
