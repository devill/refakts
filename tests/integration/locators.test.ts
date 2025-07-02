import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
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

describe('Locator Integration Tests', () => {
  const fixturesDir = path.join(__dirname, '..', 'fixtures', 'locators');
  const commandExecutor = new CommandExecutor();
  
  const getTestCases = (): TestCase[] => {
    const testCases: TestCase[] = [];
    
    if (!fs.existsSync(fixturesDir)) {
      return testCases;
    }
    
    const locatorDirs = fs.readdirSync(fixturesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const locatorDir of locatorDirs) {
      const locatorPath = path.join(fixturesDir, locatorDir);
      const files = fs.readdirSync(locatorPath);
      
      // Handle single-file test cases
      const inputFiles = files.filter(file => file.endsWith('.input.ts'));
      
      for (const inputFile of inputFiles) {
        const baseName = inputFile.replace('.input.ts', '');
        const expectedFile = `${baseName}.expected.yaml`;
        const receivedFile = `${baseName}.received.yaml`;
        
        if (files.includes(expectedFile)) {
          const inputPath = path.join(locatorPath, inputFile);
          const content = fs.readFileSync(inputPath, 'utf8');
          const meta = extractMetaFromFile(content);
          
          testCases.push({
            name: `${locatorDir}/${baseName}`,
            description: meta.description,
            commands: meta.commands,
            inputFile: inputPath,
            expectedFile: path.join(locatorPath, expectedFile),
            receivedFile: path.join(locatorPath, receivedFile),
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
    it('should have locator test fixtures (none found)', () => {
      console.warn('No locator test fixtures found in', fixturesDir);
    });
  }

  testCases.forEach(testCase => {
    const testFn = testCase.skip ? it.skip : it;
    testFn(`${testCase.name}: ${testCase.description}`, async () => {
      // Execute locator commands - these should output YAML results
      for (const command of testCase.commands) {
        let updatedCommand = command;
        const inputFileName = path.basename(testCase.inputFile);
        updatedCommand = updatedCommand.replace(inputFileName, testCase.inputFile);
        
        try {
          const output = await commandExecutor.executeCommand(updatedCommand);
          let yamlContent: string;
          
          if (typeof output === 'string') {
            if (commandExecutor.isUsingCli()) {
              // CLI execution - need to extract YAML from stdout
              const lines = output.split('\n');
              const yamlStartIndex = lines.findIndex(line => line.includes('variable:'));
              yamlContent = lines.slice(yamlStartIndex).join('\n').trim();
            } else {
              // Direct execution - output is already clean YAML
              yamlContent = output;
            }
          } else {
            // This shouldn't happen for locator commands, but handle gracefully
            yamlContent = '';
          }
          
          // Write the output to received file for comparison
          fs.writeFileSync(testCase.receivedFile, yamlContent);
          
          // Compare received vs expected YAML content
          const expected = fs.readFileSync(testCase.expectedFile, 'utf8');
          const received = fs.readFileSync(testCase.receivedFile, 'utf8');
          
          // Parse both as YAML to ensure semantic comparison
          const expectedData = yaml.load(expected);
          const receivedData = yaml.load(received);
          
          expect(receivedData).toEqual(expectedData);
        } catch (error) {
          throw new Error(`Command failed: ${updatedCommand}\n${error}`);
        }
      }
      
      // Clean up received files on success
      if (fs.existsSync(testCase.receivedFile)) {
        fs.unlinkSync(testCase.receivedFile);
      }
    });
  });
});