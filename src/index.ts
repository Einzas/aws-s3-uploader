// Importar aliases ANTES que cualquier otra cosa (para producción con PM2)
import './module-alias';
import 'reflect-metadata';
import App from './app';

const app = new App();
app.start();
