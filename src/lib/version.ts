import { getBuildInfo } from '@/lib/build-info';

export function getVersion(): string {
  return getBuildInfo().version;
}
