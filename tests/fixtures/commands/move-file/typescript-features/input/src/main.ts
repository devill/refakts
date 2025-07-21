import type { ApiResponse, ApiError } from './types/api';
import { Container } from './utils/container';
import * as MathUtils from './utils/math';
import './extensions/express';

const container = new Container<string>();
container.add('test');

const result = MathUtils.add(5, 3);
const product = MathUtils.multiply(2, 4);

console.log('Container size:', container.size());
console.log('Math result:', result);
console.log('Math product:', product);

async function fetchData(): Promise<ApiResponse<any>> {
  // Mock API response
  return { data: { message: 'Hello' }, status: 200 };
}