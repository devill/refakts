import { Node } from 'ts-morph';
import { NodeAnalyzer } from './node-analyzer';

export class UsageTypeDetector {
  determineUsageType(node: Node): 'read' | 'write' | 'update' {
    return NodeAnalyzer.determineUsageType(node);
  }

}