import { basename, resolve } from 'path';

export function resolveStoragePath(...segments: string[]) {
  const baseDirectory =
    basename(process.cwd()).toLowerCase() === 'backend'
      ? resolve(process.cwd(), 'storage')
      : resolve(process.cwd(), 'backend', 'storage');

  return resolve(baseDirectory, ...segments);
}
