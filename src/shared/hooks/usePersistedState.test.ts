import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from './usePersistedState';

describe('usePersistedState', () => {
  let getItemSpy: ReturnType<typeof vi.spyOn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => usePersistedState('test', 42));

    expect(result.current[0]).toBe(42);
    expect(getItemSpy).toHaveBeenCalledWith('slp:test');
  });

  it('supports initialValue as a function', () => {
    const { result } = renderHook(() => usePersistedState('test', () => 'lazy'));

    expect(result.current[0]).toBe('lazy');
  });

  it('reads existing value from localStorage', () => {
    getItemSpy.mockReturnValue(JSON.stringify('stored'));

    const { result } = renderHook(() => usePersistedState('test', 'default'));

    expect(result.current[0]).toBe('stored');
  });

  it('writes to localStorage on state change', () => {
    const { result } = renderHook(() => usePersistedState('test', 0));

    act(() => {
      result.current[1](5);
    });

    expect(setItemSpy).toHaveBeenCalledWith('slp:test', JSON.stringify(5));
  });

  it('handles corrupt JSON gracefully and falls back to initialValue', () => {
    getItemSpy.mockReturnValue('not valid json{{{');

    const { result } = renderHook(() => usePersistedState('test', 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });

  it('uses slp: key prefix', () => {
    renderHook(() => usePersistedState('myKey', 'val'));

    expect(getItemSpy).toHaveBeenCalledWith('slp:myKey');
  });

  it('persists object values', () => {
    const obj = { a: 1, b: 'two' };
    const { result } = renderHook(() => usePersistedState('obj', obj));

    act(() => {
      result.current[1]({ a: 2, b: 'three' });
    });

    expect(setItemSpy).toHaveBeenCalledWith(
      'slp:obj',
      JSON.stringify({ a: 2, b: 'three' }),
    );
  });
});
