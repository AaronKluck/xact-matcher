import { Piscina } from 'piscina';
import { resolve } from 'path';

export const matchOrdersPool = new Piscina({
    filename: resolve(__dirname, 'matchController.ts'),
});