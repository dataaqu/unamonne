/**
 * Render a schema.org object as a JSON-LD script tag. The data comes from our
 * own pure builders (not user free-text as HTML), and JSON.stringify escapes
 * `<`/`>` sequences via unicode, so this is safe to inject.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
