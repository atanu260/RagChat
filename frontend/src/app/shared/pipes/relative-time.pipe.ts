import { Pipe, PipeTransform } from '@angular/core';

const TIME_UNITS: ReadonlyArray<{
  readonly unit: Intl.RelativeTimeFormatUnit;
  readonly seconds: number;
}> = [
  { unit: 'year', seconds: 31_536_000 },
  { unit: 'month', seconds: 2_592_000 },
  { unit: 'week', seconds: 604_800 },
  { unit: 'day', seconds: 86_400 },
  { unit: 'hour', seconds: 3_600 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
];

@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  private readonly formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
    if (!Number.isFinite(timestamp)) {
      return '';
    }

    const differenceSeconds = Math.round((timestamp - Date.now()) / 1000);
    const timeUnit = TIME_UNITS.find(({ seconds }) => Math.abs(differenceSeconds) >= seconds)
      ?? TIME_UNITS[TIME_UNITS.length - 1];
    const amount = Math.round(differenceSeconds / timeUnit.seconds);
    return this.formatter.format(amount, timeUnit.unit);
  }
}
