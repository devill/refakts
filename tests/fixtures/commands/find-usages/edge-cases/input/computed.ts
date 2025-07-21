// Computed property access testing

export interface DataObject {
  [key: string]: any;
}

const key = 'dynamicKey';
const obj: DataObject = {
  staticKey: 'static value',
  [key]: 'dynamic value',
  anotherKey: 'another value'
};

// Different ways to access properties
const staticAccess = obj.staticKey;
const dynamicAccess = obj[key]; // Using computed property
const stringAccess = obj['staticKey'];
const variableAccess = obj[key];

// Functions using computed properties
function getValue(object: DataObject, propertyKey: string): any {
  return object[propertyKey];
}

function setValue(object: DataObject, propertyKey: string, value: any): void {
  object[propertyKey] = value;
}

// Usage examples
const result1 = getValue(obj, key);
const result2 = getValue(obj, 'staticKey');
setValue(obj, key, 'new value');
setValue(obj, 'anotherKey', 'updated value');

// Complex computed access
const keys = ['staticKey', 'anotherKey', key];
const values = keys.map(k => obj[k]);

// Using key in different contexts
console.log(`Key is: ${key}`);
const keyLength = key.length;
const keyUpper = key.toUpperCase();