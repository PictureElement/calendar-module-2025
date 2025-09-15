const BASE_LEVEL = 1;

// Heading component that creates dynamic heading levels based on a base level and an offset.
export default function Heading({ levelOffset, children, ...rest }) {
  const level = Math.min(Math.max(BASE_LEVEL + (levelOffset || 0), 1), 6);
  const Tag = `h${level}`;
  return <Tag {...rest}>{children}</Tag>
}
