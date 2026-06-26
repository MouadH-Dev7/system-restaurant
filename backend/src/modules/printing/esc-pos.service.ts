import { Injectable } from '@nestjs/common';

type EscPosPayload = {
  title: string;
  lines: string[];
};

@Injectable()
export class EscPosService {
  private readonly ESC = '\u001b';
  private readonly GS = '\u001d';

  buildDocument(payload: EscPosPayload) {
    const parts: string[] = [];
    parts.push(this.initialize());
    parts.push(this.align('center'));
    parts.push(this.bold(true));
    parts.push(this.doubleSize(true));
    parts.push(`${payload.title}\n`);
    parts.push(this.doubleSize(false));
    parts.push(this.bold(false));
    parts.push(this.align('left'));
    parts.push('--------------------------------\n');

    for (const line of payload.lines) {
      parts.push(`${line}\n`);
    }

    parts.push('--------------------------------\n');
    parts.push('\n\n');
    parts.push(this.cut());

    return parts.join('');
  }

  initialize() {
    return `${this.ESC}@`;
  }

  align(mode: 'left' | 'center' | 'right') {
    const code = mode === 'left' ? 0 : mode === 'center' ? 1 : 2;
    return `${this.ESC}a${String.fromCharCode(code)}`;
  }

  bold(enabled: boolean) {
    return `${this.ESC}E${String.fromCharCode(enabled ? 1 : 0)}`;
  }

  doubleSize(enabled: boolean) {
    return `${this.GS}!${String.fromCharCode(enabled ? 0x11 : 0x00)}`;
  }

  cut() {
    return `${this.GS}V${String.fromCharCode(0)}`;
  }
}
