// File that uses destructured imports

import { original as renamed, anotherFunc, CONFIG } from './destructured';

// Using renamed import
const result1 = renamed(5);
const result2 = renamed(10);

// Using normal import
const result3 = anotherFunc(3);

// Using destructured config
const { timeout, retries } = CONFIG;
const timeoutValue = timeout;
const retryCount = retries;

// Using renamed function in different contexts
function processData(data: number[]): number[] {
  return data.map(renamed);
}

const processedData = processData([1, 2, 3, 4, 5]);

// Multiple usages of renamed function
const calculation1 = renamed(100);
const calculation2 = renamed(200);
const calculation3 = renamed(calculation1);