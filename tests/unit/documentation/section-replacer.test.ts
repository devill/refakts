import { verify } from 'approvals';
import { 
  BASIC_MARKDOWN_CONTENT,
  MISSING_START_MARKER,
  MISSING_END_MARKER,
  NO_MARKERS,
  NESTED_MARKERS
} from '../../fixtures/unit/documentation/section-samples';
import { SectionReplacer } from '../../../src/dev/section-replacer';
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

  test('replaces section with valid markers', () => {
    const result = replaceSection({
      content: BASIC_MARKDOWN_CONTENT,
      startMarker: '<!-- AUTO-GENERATED HELP START -->',
      endMarker: '<!-- AUTO-GENERATED HELP END -->',
      newContent: 'New help content'
    });
    
    verify(__dirname, 'section-replacer.replaces section with valid markers', result, { reporters: ['donothing'] });
  });

  test('handles missing start marker', () => {
    const result = replaceSection({
      content: MISSING_START_MARKER,
      startMarker: '<!-- AUTO-GENERATED HELP START -->',
      endMarker: '<!-- AUTO-GENERATED HELP END -->',
      newContent: 'New help content'
    });
    
    verify(__dirname, 'section-replacer.handles missing start marker', result, { reporters: ['donothing'] });
  });

  test('handles missing end marker', () => {
    const result = replaceSection({
      content: MISSING_END_MARKER,
      startMarker: '<!-- AUTO-GENERATED HELP START -->',
      endMarker: '<!-- AUTO-GENERATED HELP END -->',
      newContent: 'New help content'
    });
    
    verify(__dirname, 'section-replacer.handles missing end marker', result, { reporters: ['donothing'] });
  });

  test('handles content with no markers', () => {
    const result = replaceSection({
      content: NO_MARKERS,
      startMarker: '<!-- AUTO-GENERATED HELP START -->',
      endMarker: '<!-- AUTO-GENERATED HELP END -->',
      newContent: 'New help content'
    });
    
    verify(__dirname, 'section-replacer.handles content with no markers', result, { reporters: ['donothing'] });
  });

  test('handles nested markers correctly', () => {
    const result = replaceSection({
      content: NESTED_MARKERS,
      startMarker: '<!-- AUTO-GENERATED HELP START -->',
      endMarker: '<!-- AUTO-GENERATED HELP END -->',
      newContent: 'New help content'
    });
    
    verify(__dirname, 'section-replacer.handles nested markers correctly', result, { reporters: ['donothing'] });
  });

  test('replaces quality checks section', () => {
    const result = replaceSection({
      content: BASIC_MARKDOWN_CONTENT,
      startMarker: '<!-- AUTO-GENERATED QUALITY-CHECKS START -->',
      endMarker: '<!-- AUTO-GENERATED QUALITY-CHECKS END -->',
      newContent: '**Quality Checks Include:**\n````\n- **COMMENTS DETECTED** (Comments indicate code that is not self-documenting.)\n````'
    });
    
    verify(__dirname, 'section-replacer.replaces quality checks section', result, { reporters: ['donothing'] });
  });
});