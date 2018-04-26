import { StringUtils } from './StringUtils';

describe('StringUtils', () => {

  const decoded = 'Déjeuner en paix';
  const encoded = 'DÃ©jeuner en paix';

  it('should decode UTF-8', () => {
    expect(StringUtils.utf8Decode(encoded)).toBe(decoded);
  });

  it('should encode UTF-8', () => {
    expect(StringUtils.utf8Encode(decoded)).toBe(encoded);
  });
});
