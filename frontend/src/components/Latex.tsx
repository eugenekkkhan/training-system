import katex from 'katex';

type Segment =
  | { type: 'text'; content: string }
  | { type: 'inline'; content: string }
  | { type: 'block'; content: string };

function parse(text: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  let buf = '';

  while (i < text.length) {
    if (text[i] === '$' && text[i + 1] === '$') {
      if (buf) { segments.push({ type: 'text', content: buf }); buf = ''; }
      const end = text.indexOf('$$', i + 2);
      if (end === -1) { buf += text.slice(i); break; }
      segments.push({ type: 'block', content: text.slice(i + 2, end) });
      i = end + 2;
    } else if (text[i] === '$') {
      const end = text.indexOf('$', i + 1);
      if (end === -1) { buf += text[i++]; continue; }
      if (buf) { segments.push({ type: 'text', content: buf }); buf = ''; }
      segments.push({ type: 'inline', content: text.slice(i + 1, end) });
      i = end + 1;
    } else {
      buf += text[i++];
    }
  }
  if (buf) segments.push({ type: 'text', content: buf });
  return segments;
}

function renderMath(latex: string, displayMode: boolean) {
  return katex.renderToString(latex, { displayMode, throwOnError: false, output: 'html' });
}

interface Props {
  children: string;
  block?: boolean;
}

export function Latex({ children, block }: Props) {
  if (!children) return null;

  // Treat entire string as math if block=true and no delimiters present
  if (block && !children.includes('$')) {
    return (
      <span
        dangerouslySetInnerHTML={{ __html: renderMath(children, true) }}
      />
    );
  }

  const segments = parse(children);
  if (segments.length === 1 && segments[0].type === 'text') {
    return <>{children}</>;
  }

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.content}</span>;
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: renderMath(seg.content, seg.type === 'block') }}
          />
        );
      })}
    </>
  );
}
