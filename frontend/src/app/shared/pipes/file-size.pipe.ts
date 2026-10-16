import { Pipe, PipeTransform } from '@angular/core';

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

@Pipe({
  name: 'fileSize',
  standalone: true,
})
export class FileSizePipe implements PipeTransform {
  transform(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) {
      return '—';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZE_UNITS.length - 1);
    const value = bytes / (1024 ** unitIndex);
    const formatted = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: value < 10 ? 1 : 0,
    }).format(value);
    return `${formatted} ${SIZE_UNITS[unitIndex]}`;
  }
}
