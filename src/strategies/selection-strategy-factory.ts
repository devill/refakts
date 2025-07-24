import { SelectionStrategy } from './selection-strategy';
import { RangeSelectionStrategy } from '../core/services/selection/range-selection-strategy';
import { StructuralSelectionStrategy } from './structural-selection-strategy';
import { BoundarySelectionStrategy } from '../core/services/selection/boundary-selection-strategy';
import { RegexSelectionStrategy } from '../core/services/selection/regex-selection-strategy';

export class SelectionStrategyFactory {
  private strategies: SelectionStrategy[] = [
    new RangeSelectionStrategy(),
    new StructuralSelectionStrategy(),
    new BoundarySelectionStrategy(),
    new RegexSelectionStrategy()
  ];

  getStrategy(options: Record<string, unknown>): SelectionStrategy {
    const strategy = this.strategies.find(s => s.canHandle(options));
    if (!strategy) {
      throw new Error('No suitable selection strategy found for the given options');
    }
    return strategy;
  }
}