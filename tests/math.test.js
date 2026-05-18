// math.test.js
import { addTest } from '../controllers/math.js';

describe('Math Functions Test', () => {
  it('should add two numbers correctly', () => {
    expect(addTest(2, 3)).toBe(5);
  });
});
