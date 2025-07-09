/**
 * Test file to verify CI quality checks work correctly
 * This file intentionally contains quality issues to test the workflow
 */

export class TestCIQuality {
    // TODO: This is a comment that should trigger quality checks
    // FIXME: Another comment that might be flagged
    
    /**
     * This method has too many parameters to test quality checks
     * @param param1 First parameter
     * @param param2 Second parameter  
     * @param param3 Third parameter
     * @param param4 Fourth parameter
     * @param param5 Fifth parameter - this should trigger "too many parameters" warning
     */
    testMethodWithManyParameters(
        param1: string,
        param2: number,
        param3: boolean,
        param4: object,
        param5: string[]
    ): void {
        // This method intentionally has many parameters to trigger quality checks
        console.log('Testing CI quality workflow with parameters:', 
            param1, param2, param3, param4, param5);
        
        // Adding some complexity to potentially trigger complexity warnings
        if (param3) {
            if (param2 > 10) {
                if (param1.length > 5) {
                    if (param4) {
                        if (param5.length > 0) {
                            console.log('Nested conditions to increase complexity');
                        }
                    }
                }
            }
        }
    }

    // A method that uses external data heavily (feature envy)
    processExternalData(data: { value: number; name: string; active: boolean }): string {
        return `${data.name}: ${data.value} (${data.active ? 'active' : 'inactive'})`;
    }
}