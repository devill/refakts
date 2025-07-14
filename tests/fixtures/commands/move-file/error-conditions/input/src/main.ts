import { formatName } from './utils/helper';
import { ModuleA } from './modules/a';

const formatted = formatName('test');
const moduleA = new ModuleA();

console.log('Formatted:', formatted);
console.log('Module A ready:', moduleA.isReady());