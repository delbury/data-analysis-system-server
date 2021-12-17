import session from 'koa-session';
import redisStore from 'koa-redis';

export const sessionConfig: Partial<session.opts> = {
  maxAge: 24 * 3600 * 1000,
  httpOnly: true,
  // 外部存储 session
  store: redisStore({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  }),
};
