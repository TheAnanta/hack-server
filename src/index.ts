import express, { json } from 'express';

import cors from 'cors';
import authRouter from './router/auth-router';
import userRouter from './router/user-router';
import teamRouter from './router/team-router';
import eventRouter from './router/event-router';
import orgRouter from './router/org-router';
import problemRouter from './router/problem-router';
import adminRouter from './router/admin-router';
import paymentRouter from './router/payment-router';
import judgeRouter from './router/judge-router';
import resultRouter from './router/result-router';

const app = express();
const port = process.env.PORT || 3000;
app.use(json());
app.use(cors());

app.get('/', (_req, res) => {
  res.send('Hello from Express + TypeScript + Prisma!');
});

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/teams', teamRouter);
app.use('/events', eventRouter);
app.use('/orgs', orgRouter);
app.use('/problems', problemRouter);
app.use('/admin', adminRouter);
app.use('/payments', paymentRouter);
app.use('/judging', judgeRouter);
app.use('/results', resultRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

