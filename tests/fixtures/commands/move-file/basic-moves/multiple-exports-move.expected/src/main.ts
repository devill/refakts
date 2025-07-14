import { add, multiply } from './utils/math';
import { capitalize, slugify } from './lib/string-utils';
import Button from './components/button';
import ApiService, { ApiConfig } from './services/api';

const result = add(5, 3);
const product = multiply(4, 7);
const title = capitalize('hello world');
const slug = slugify('My Blog Post');

const button = new Button('Click me');
const config: ApiConfig = { baseUrl: 'https://api.example.com' };
const api = new ApiService(config);

console.log('Result:', result);
console.log('Product:', product);
console.log('Title:', title);
console.log('Slug:', slug);
console.log('Button:', button.render());
console.log('API ready:', api.isReady());