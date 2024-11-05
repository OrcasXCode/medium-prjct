import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';

const app = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        JWT_SECRET: string,
    }
}>();

app.post('/api/v1/signup', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    // Validate input
    if (!body.email || !body.password) {
        return c.json({ error: "Email and password are required" }, { status: 400 });
    }

    try {
        await prisma.$connect(); // Ensure database connection

        const user = await prisma.user.create({
            data: {
                email: body.email,
                password: body.password,
            }
        });

        const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
        return c.json({ jwt });
    } catch (e) {
        console.error('Signup error:', e); // Log the error
        return c.json({ error: "Error while signing up" }, { status: 500 }); // Return a proper 500 response
    } finally {
        await prisma.$disconnect(); // Clean up the database connection
    }
});



app.post('/api/v1/signin', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const user = await prisma.user.findUnique({
		where: {
			email: body.email
		}
	});

	if (!user) {
		c.status(403);
		return c.json({ error: "user not found" });
	}

	const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
	return c.json({ jwt });
})


export default app;
