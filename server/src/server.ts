import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[PathForge Server] Listening on http://localhost:${PORT}`);
  console.log(`[PathForge Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});
