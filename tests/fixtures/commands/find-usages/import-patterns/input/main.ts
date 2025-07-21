// Main file demonstrating different import patterns

// Named imports
import { format, validate, CONSTANTS } from './lib/utils';
import { getCurrentTime } from './lib/utils'; // Re-exported

// Default import
import Logger from './lib/logger';

// Namespace import
import * as API from './modules/api';

// Side-effect import
import './styles/global.css';

// Using named imports
const formattedText = format('hello world');
const isValid = validate(formattedText);
const maxLength = CONSTANTS.MAX_LENGTH;

// Using re-exported function
const timestamp = getCurrentTime();

// Using default import
const logger = new Logger('APP');
logger.info('Application started');
logger.warn('This is a warning');

// Using namespace import
const users = API.get('/users');
const result = API.post('/users', { name: 'John' });

// Dynamic import usage
async function loadLazyModule() {
  const { heavyTask, computeHash } = await import('./modules/lazy');
  const result = await heavyTask();
  const hash = computeHash(result);
  return { result, hash };
}

// Multiple usages of same imported function
const text1 = format('first');
const text2 = format('second');
const text3 = format('third');

// Multiple usages with different import patterns
const time1 = getCurrentTime();
const time2 = getCurrentTime();
API.get('/posts').then(posts => {
  posts.forEach((post: any) => {
    const formatted = format(post.title);
    logger.info(`Post: ${formatted}`);
  });
});