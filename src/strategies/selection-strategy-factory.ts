import { SelectionStrategy } from './selection-strategy';
import { RangeSelectionStrategy } from './range-selection-strategy';
import { StructuralSelectionStrategy } from './structural-selection-strategy';
import { BoundarySelectionStrategy } from './boundary-selection-strategy';
import { RegexSelectionStrategy } from './regex-selection-strategy';

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

  getAllStrategies(): SelectionStrategy[] {
    return [...this.strategies];
  }
}