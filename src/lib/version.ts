export function getVersion(): string {
  try {
    const pkg = require('../../package.json');
    return pkg.version;
  } catch {
    return 'unknown';
  }
}
