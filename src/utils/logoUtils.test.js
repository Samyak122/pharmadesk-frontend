import { describe, expect, it } from 'vitest';
import { resolvePharmacyLogo } from './logoUtils';

describe('resolvePharmacyLogo', () => {
  it('returns the bundled default logo even when a logo URL is present in settings', () => {
    const logo = resolvePharmacyLogo({ logo_url: 'https://example.com/custom-logo.png' });
    const fallback = resolvePharmacyLogo({});

    expect(typeof logo).toBe('string');
    expect(logo).toBe(fallback);
    expect(logo.length).toBeGreaterThan(0);
  });
});
