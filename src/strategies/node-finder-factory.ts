import { NodeFinder } from './node-finder';
import { TSQueryNodeFinder } from './tsquery-node-finder';
import { RegexNodeFinder } from './regex-node-finder';

export class NodeFinderFactory {
  static create(options: Record<string, any>): NodeFinder {
    if (options.regex) {
      return new RegexNodeFinder();
    } else if (options.query) {
      return new TSQueryNodeFinder();
    } else {
      throw new Error('Either --query or --regex must be specified');
    }
  }
}