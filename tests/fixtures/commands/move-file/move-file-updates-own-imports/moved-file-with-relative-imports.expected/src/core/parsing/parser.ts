import { validateInput } from '../../utils/validator';
import { formatResult } from '../../helpers/formatter';

export function parseData(input: string): any {
    const isValid = validateInput(input);
    if (!isValid) {
        throw new Error('Invalid input');
    }
    
    const result = JSON.parse(input);
    return formatResult(result);
}