import session from 'koa-session';

export const sessionConfig: Partial<session.opts> = {
  maxAge: 24 * 3600 * 1000,
  httpOnly: true,
};
