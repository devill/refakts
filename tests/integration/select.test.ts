import * as fs from 'fs';
import * as path from 'path';
import { CommandExecutor } from '../utils/command-executor';

interface TestCase {
  name: string;
  description: string;
  commands: string[];
  inputFile: string;
  expectedFile: string;
  receivedFile: string;
  skip?: boolean;
}

interface TestMeta {
  description: string;
  commands: string[];
  skip?: boolean;
}

describe('Select Integration Tests', () => {
  const fixturesDir = path.join(__dirname, '..', 'fixtures', 'select');
  const commandExecutor = new CommandExecutor();
  
  const getTestCases = (): TestCase[] => {
    const testCases: TestCase[] = [];
    
    if (!fs.existsSync(fixturesDir)) {
      return testCases;
    }
    
    const selectDirs = fs.readdirSync(fixturesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const selectDir of selectDirs) {
      const selectPath = path.join(fixturesDir, selectDir);
      const files = fs.readdirSync(selectPath);
      
      // Handle single-file test cases
      const inputFiles = files.filter(file => file.endsWith('.input.ts'));
      
      for (const inputFile of inputFiles) {
        const baseName = inputFile.replace('.input.ts', '');
        const expectedFile = `${baseName}.expected.txt`;
        const receivedFile = `${baseName}.received.txt`;
        
        if (files.includes(expectedFile)) {
          const inputPath = path.join(selectPath, inputFile);
          const content = fs.readFileSync(inputPath, 'utf8');
          const meta = extractMetaFromFile(content);
          
          testCases.push({
            name: `${selectDir}/${baseName}`,
            description: meta.description,
            commands: meta.commands,
            inputFile: inputPath,
            expectedFile: path.join(selectPath, expectedFile),
            receivedFile: path.join(selectPath, receivedFile),
            skip: meta.skip
          });
        }
      }
    }
    
    return testCases;
  };

  const extractMetaFromFile = (content: string): TestMeta => {
    const lines = content.split('\n');
    let description = '';
    const commands: string[] = [];
    let skip = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('* @description')) {
        description = trimmed.replace('* @description', '').trim();
      } else if (trimmed.startsWith('* @command')) {
        commands.push(trimmed.replace('* @command', '').trim());
      } else if (trimmed.startsWith('* @skip')) {
        skip = true;
      }
    }
    
    return { description, commands, skip };
  };

  const testCases = getTestCases();
  
  if (testCases.length === 0) {
    it('should have select test fixtures (none found)', () => {
      console.warn('No select test fixtures found in', fixturesDir);
    });
  }

  testCases.forEach(testCase => {
    const testFn = testCase.skip ? it.skip : it;
    testFn(`${testCase.name}: ${testCase.description}`, async () => {
      // Execute select commands - these should output text with location specifiers
      for (const command of testCase.commands) {
        let updatedCommand = command;
        const inputFileName = path.basename(testCase.inputFile);
        updatedCommand = updatedCommand.replace(inputFileName, testCase.inputFile);
        
        try {
          const output = await commandExecutor.executeCommand(updatedCommand);
          let textContent: string;
          
          if (typeof output === 'string') {
            if (commandExecutor.isUsingCli()) {
              // CLI execution - clean up any extra output and get the core result
              textContent = output.trim();
            } else {
              // Direct execution - output should already be clean text
              textContent = output.trim();
            }
          } else {
            // This shouldn't happen for select commands, but handle gracefully
            textContent = '';
          }
          
          // Write the output to received file for comparison
          fs.writeFileSync(testCase.receivedFile, textContent);
          
          // Compare received vs expected text content
          const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
          const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
          
          expect(received).toBe(expected);
        } catch (error) {
          // For error cases, write the error message to received file and compare
          const errorMessage = (error as Error).message;
          fs.writeFileSync(testCase.receivedFile, errorMessage);
          
          // Compare received vs expected text content  
          const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
          const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
          
          expect(received).toBe(expected);
        }
      }
      
      // Clean up received files on success
      if (fs.existsSync(testCase.receivedFile)) {
        fs.unlinkSync(testCase.receivedFile);
      }
    });
  });
});