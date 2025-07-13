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
import { GoldenFileTestUtility } from '../../utils/golden-file-test-utility';
import { DocumentationTestHelper } from './test-helpers';
import { SectionReplacementRequest } from '../../../src/core/section-replacement-request';

const sectionReplacer = new SectionReplacer(true);

interface SectionReplacementParams {
  content: string;
  startMarker: string;
  endMarker: string;
  newContent: string;
}

function replaceSection(params: SectionReplacementParams): string {
  const request = new SectionReplacementRequest(
    params.content,
    params.startMarker,
    params.endMarker,
    params.newContent
  );
  return sectionReplacer.replaceSection(request);
}

describe('Section Replacer', () => {
  const expectedDir = path.join(__dirname, '../../fixtures/unit/documentation');

  test('replaces section with valid markers', () => {
    const result = replaceSection({
      content: BASIC_MARKDOWN_CONTENT,
      startMarker: '<!-- AUTO-GENERATED HELP START -->',
      endMarker: '<!-- AUTO-GENERATED HELP END -->',
      newContent: 'New help content'
    });
    
    DocumentationTestHelper.expectToMatchExpectedFile(result, expectedDir, 'basic-section-replacement.expected.txt');
  });

  test('handles missing start marker', () => {
    const result = replaceSection({
      content: MISSING_START_MARKER,
      startMarker: '<!-- AUTO-GENERATED HELP START -->',
      endMarker: '<!-- AUTO-GENERATED HELP END -->',
      newContent: 'New help content'
    });
    
    GoldenFileTestUtility.expectToMatchGoldenFile(
      result,
      expectedDir,
      'missing-start-marker.expected.txt'
    );
  });

  test('handles missing end marker', () => {
    const result = replaceSection({
      content: MISSING_END_MARKER,
      startMarker: '<!-- AUTO-GENERATED HELP START -->',
      endMarker: '<!-- AUTO-GENERATED HELP END -->',
      newContent: 'New help content'
    });
    
    GoldenFileTestUtility.expectToMatchGoldenFile(
      result,
      expectedDir,
      'missing-end-marker.expected.txt'
    );
  });

  test('handles content with no markers', () => {
    const result = replaceSection({
      content: NO_MARKERS,
      startMarker: '<!-- AUTO-GENERATED HELP START -->',
      endMarker: '<!-- AUTO-GENERATED HELP END -->',
      newContent: 'New help content'
    });
    
    GoldenFileTestUtility.expectToMatchGoldenFile(
      result,
      expectedDir,
      'no-markers.expected.txt'
    );
  });

  test('handles nested markers correctly', () => {
    const result = replaceSection({
      content: NESTED_MARKERS,
      startMarker: '<!-- AUTO-GENERATED HELP START -->',
      endMarker: '<!-- AUTO-GENERATED HELP END -->',
      newContent: 'New help content'
    });
    
    GoldenFileTestUtility.expectToMatchGoldenFile(
      result,
      expectedDir,
      'nested-markers.expected.txt'
    );
  });

  test('replaces quality checks section', () => {
    const result = replaceSection({
      content: BASIC_MARKDOWN_CONTENT,
      startMarker: '<!-- AUTO-GENERATED QUALITY-CHECKS START -->',
      endMarker: '<!-- AUTO-GENERATED QUALITY-CHECKS END -->',
      newContent: '**Quality Checks Include:**\n````\n- **COMMENTS DETECTED** (Comments indicate code that is not self-documenting.)\n````'
    });
    
    const expectedPath = path.join(expectedDir, 'quality-section-replacement.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });
});