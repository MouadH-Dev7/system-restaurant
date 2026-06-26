import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'net';

type PrinterTarget = {
  host: string;
  port: number;
};

@Injectable()
export class PrinterTransportService {
  constructor(private readonly config: ConfigService) {}

  async send(target: PrinterTarget, payload: string) {
    if (this.config.get<string>('SIMULATE_PRINTER_OFFLINE') === 'true') {
      throw new InternalServerErrorException('Printer offline');
    }

    await new Promise<void>((resolve, reject) => {
      const socket = new Socket();
      let settled = false;

      const closeWithError = (error: Error) => {
        if (settled) {
          return;
        }

        settled = true;
        socket.destroy();
        reject(error);
      };

      socket.setTimeout(5_000);
      socket.once('error', closeWithError);
      socket.once('timeout', () => closeWithError(new Error('Printer connection timed out')));

      socket.connect(target.port, target.host, () => {
        socket.write(Buffer.from(payload, 'binary'), (error) => {
          if (error) {
            closeWithError(error);
            return;
          }

          socket.end(() => {
            if (settled) {
              return;
            }

            settled = true;
            resolve();
          });
        });
      });
    });
  }
}
