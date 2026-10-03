import { Badge } from './Badge';

/** Single reusable status badge — do not hardcode tones per page. */
export function StatusBadge({ value }: { value?: string }) {
  return <Badge value={value} />;
}
