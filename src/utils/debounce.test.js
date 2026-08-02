import { describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  it('delays the callback until the interval elapses', async () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 50);

    debounced('first');
    debounced('second');

    expect(callback).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('second');
  });
});
