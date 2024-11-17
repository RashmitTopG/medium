import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { decode, jwt, sign, verify } from 'hono/jwt';
import { initMiddleware } from './middleware';

// Create an instance of the Hono framework with type bindings for environment variables
const app = new Hono<{
  Bindings: {
    DATABASE_URL: string; // Environment variable for the database URL
    JWT_SECRET: string;   // Environment variable for JWT secret
  };
}>();

initMiddleware(app)

// Basic route to check server functionality
app.get('/', (c) => {
  return c.text('Hello Hono!');
});

// Signup route to register a new user
app.post('/api/v1/signup', async (c) => {
  // Initialize a Prisma client instance for database operations
  const prisma = new PrismaClient({
    // @ts-ignore: Ignore TypeScript error for missing datasourceUrl property
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Parse the request body to get user information
    const body = await c.req.json();

    // Check if a user with the given email already exists
    const userFound = await prisma.user.findFirst({
      where: { email: body.email },
    });

    if (userFound) {
      // If user already exists, return a message indicating so
      return c.text('User Already Exists');
    }

    // Create a new user with the provided email, name, and password
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: body.password,
      },
    });

    // Sign a JWT token with the user's ID as the payload
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    // Return the generated JWT token as a JSON response
    return c.json({ jwt: token });
  } catch (error) {
    // If any error occurs during signup, log it and return a 500 error response
    console.error("Signup error:", error);
    return c.json({ error: "Signup failed" }, 500);
  } finally {
    // Ensure the Prisma client is disconnected after the request
    await prisma.$disconnect();
  }
});

// Signin route for user login
app.post('/api/v1/signin', async (c) => {
  // Initialize a Prisma client instance for database operations
  const prisma = new PrismaClient({
    // @ts-ignore: Ignore TypeScript error for missing datasourceUrl property
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Parse the request body to get login information
    const body = await c.req.json();

    // Find a user with the given email and password
    const user = await prisma.user.findFirst({
      where: {
        email: body.email,
        password: body.password,
      },
    });

    if (!user) {
      // If no user is found, return a message indicating invalid credentials
      return c.text('No User found with that credentials');
    }

    // Sign a JWT token with the user's ID as the payload
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    // Return a success message and the generated JWT token as a JSON response
    return c.json({ message: 'Login Successful', jwt: token });
  } catch (error) {
    // If any error occurs during signin, log it and return a 500 error response
    console.error("Signin error:", error);
    return c.json({ error: "Signin failed" }, 500);
  } finally {
    // Ensure the Prisma client is disconnected after the request
    await prisma.$disconnect();
  }
});

// Export the Hono app as the default export
export default app;






// await Promise.all([prisma.user.create({
// data :{
//   email : "test@gmail.com",
//   password : "test123"

// }}),Prisma.user.create({
//   data :{
//     email : "test2@gmail.com",
//     password : "test123"

//   }
// })])


// Can do this when the two async calls are independent of each other 
// In this way they can run in parallel 
// The second call does not wait for the first call to finish executing