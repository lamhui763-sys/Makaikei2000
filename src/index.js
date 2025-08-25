import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import pino from 'pino';
import pretty from 'pino-pretty';
import { fileURLToPath } from 'url';
import { router as uiRouter } from './routes/ui.js';
import { initDatabase } from './db/init.js';
import { startSchedulers } from './services/scheduler.js';
import localtunnel from 'localtunnel';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino(pretty({ colorize: true }));
const app = express();
let tunnelUrl = null;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', uiRouter);

app.get('/_tunnel', (req, res) => {
  if (!tunnelUrl) return res.status(503).json({ ok: false, message: 'Tunnel not ready' });
  return res.json({ ok: true, url: tunnelUrl });
});

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  await initDatabase(logger);
  await startSchedulers(logger);

  const server = app.listen(PORT, async () => {
    logger.info(`旅遊易 server started on http://localhost:${PORT}`);
    try {
      if (process.env.ENABLE_TUNNEL === 'true') {
        const tunnel = await localtunnel({ port: Number(PORT) });
        tunnelUrl = tunnel.url;
        logger.info(`Public URL: ${tunnelUrl}`);
        tunnel.on('close', () => logger.warn('Tunnel closed'));
      }
    } catch (error) {
      logger.error({ error }, 'Failed to start tunnel');
    }
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to bootstrap application');
  process.exit(1);
});

