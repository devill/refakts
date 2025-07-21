// Main file using complex scoping patterns

// Deep nested import
import { deepUtil, anotherDeep } from './deep/nested/modules/utils';

// Circular imports
import { functionA, callModuleB } from './circular-a/module-a';
import { functionB, callModuleA } from './circular-b/module-b';

// Barrel imports
import { process, getCount, transform, validate, format, parse, MainService } from './barrel';

// Using deeply nested functions
const deepResult = deepUtil('test');
const deepNumber = anotherDeep(5);

// Using circular imports
const resultA = functionA();
const resultB = functionB();
const crossCallA = callModuleA();
const crossCallB = callModuleB();

// Using barrel exports
const processed = process('data');
const count = getCount();
const transformed = transform('HELLO');
const isValid = validate('test');
const formatted = format('world');
const parsed = parse('{"key": "value"}');

// Using default export from barrel
const service = new MainService();
const internalCount = service.getInternalCount();
const moduleCount = service.getModuleCount();

// Multiple usages to test cross-references
const deepResult2 = deepUtil('another test');
const deepResult3 = deepUtil('third test');
const transformed2 = transform('WORLD');
const transformed3 = transform('GOODBYE');