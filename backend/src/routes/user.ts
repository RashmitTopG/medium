import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign } from 'hono/jwt';
import { signupInput } from '@rashmit49/medium-common';
import { signinInput } from '@rashmit49/medium-common';
import z from 'zod';

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post('/signup', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const body = await c.req.json();
    const { success, error } = signupInput.safeParse(body);

    if (!success) {
      c.status(400);
      return c.json({ error: 'Invalid request body', details: error.errors });
    }

    const userFound = await prisma.user.findFirst({
      where: { email: body.email },
    });

    if (userFound) {
      c.status(409); // Conflict status code
      return c.json({ error: 'User already exists with this email' });
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: body.password,
      },
    });

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({ message: 'Signup successful', jwt: token });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Signup failed due to server error' }, 500);
  } finally {
    await prisma.$disconnect();
  }
});

// Signin route for user login
userRouter.post('/signin', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const body = await c.req.json();
    const { success, error } = signinInput.safeParse(body);

    if (!success) {
      c.status(400);
      return c.json({ error: 'Invalid request body', details: error.errors });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: body.email,
        password: body.password,
      },
    });

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401); // Unauthorized
    }

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({ message: 'Login successful', jwt: token });
  } catch (error) {
    console.error('Signin error:', error);
    return c.json({ error: 'Signin failed due to server error' }, 500);
  } finally {
    await prisma.$disconnect();
  }
});

// Export the Hono app as the default export
export default userRouter;
