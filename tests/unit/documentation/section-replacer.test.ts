import * as fs from 'fs';
import * as path from 'path';
import { 
  BASIC_MARKDOWN_CONTENT,
  MISSING_START_MARKER,
  MISSING_END_MARKER,
  NO_MARKERS,
  NESTED_MARKERS
} from '../../fixtures/unit/documentation/section-samples';
import { SectionReplacer } from '../../../src/documentation/SectionReplacer';
import { SectionReplacementRequest } from '../../../src/core/section-replacement-request';

const sectionReplacer = new SectionReplacer();

function replaceSection(content: string, startMarker: string, endMarker: string, newContent: string): string {
  const request = new SectionReplacementRequest(content, startMarker, endMarker, newContent);
  return sectionReplacer.replaceSection(request);
}

describe('Section Replacer', () => {
  const expectedDir = path.join(__dirname, '../../fixtures/unit/documentation');

  test('replaces section with valid markers', () => {
    const result = replaceSection(
      BASIC_MARKDOWN_CONTENT,
      '<!-- AUTO-GENERATED HELP START -->',
      '<!-- AUTO-GENERATED HELP END -->',
      'New help content'
    );
    
    const expectedPath = path.join(expectedDir, 'basic-section-replacement.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });

  test('handles missing start marker', () => {
    const result = replaceSection(
      MISSING_START_MARKER,
      '<!-- AUTO-GENERATED HELP START -->',
      '<!-- AUTO-GENERATED HELP END -->',
      'New help content'
    );
    
    const expectedPath = path.join(expectedDir, 'missing-start-marker.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });

  test('handles missing end marker', () => {
    const result = replaceSection(
      MISSING_END_MARKER,
      '<!-- AUTO-GENERATED HELP START -->',
      '<!-- AUTO-GENERATED HELP END -->',
      'New help content'
    );
    
    const expectedPath = path.join(expectedDir, 'missing-end-marker.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });

  test('handles content with no markers', () => {
    const result = replaceSection(
      NO_MARKERS,
      '<!-- AUTO-GENERATED HELP START -->',
      '<!-- AUTO-GENERATED HELP END -->',
      'New help content'
    );
    
    const expectedPath = path.join(expectedDir, 'no-markers.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });

  test('handles nested markers correctly', () => {
    const result = replaceSection(
      NESTED_MARKERS,
      '<!-- AUTO-GENERATED HELP START -->',
      '<!-- AUTO-GENERATED HELP END -->',
      'New help content'
    );
    
    const expectedPath = path.join(expectedDir, 'nested-markers.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });

  test('replaces quality checks section', () => {
    const result = replaceSection(
      BASIC_MARKDOWN_CONTENT,
      '<!-- AUTO-GENERATED QUALITY-CHECKS START -->',
      '<!-- AUTO-GENERATED QUALITY-CHECKS END -->',
      '**Quality Checks Include:**\n````\n- **COMMENTS DETECTED** (Comments indicate code that is not self-documenting.)\n````'
    );
    
    const expectedPath = path.join(expectedDir, 'quality-section-replacement.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });
});