// Pure CSS tooltip — works in server components, no client JS needed
// Uses Tailwind v4 named group (group/tip) to avoid leaking into parent group context
export default function Tooltip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-block align-middle" tabIndex={0} style={{ outline: 'none' }}>
      <span
        className="cursor-help ml-1 select-none inline-flex items-center justify-center rounded-full"
        style={{
          color: 'var(--muted2)',
          fontSize: '9px',
          width: '13px',
          height: '13px',
          border: '1px solid var(--muted2)',
          lineHeight: 1,
        }}
      >
        ?
      </span>
      <span
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-20
                   opacity-0 group-hover/tip:opacity-100 group-focus/tip:opacity-100
                   transition-opacity duration-150"
        style={{
          background: '#1a1e2f',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: '8px',
          padding: '9px 12px',
          fontSize: '11px',
          lineHeight: '1.65',
          color: 'var(--text2)',
          whiteSpace: 'normal',
          boxShadow: '0 6px 24px rgba(0,0,0,.5)',
          textAlign: 'left',
          fontWeight: 400,
        }}
      >
        {text}
        <span
          className="absolute left-1/2 -translate-x-1/2 top-full"
          style={{
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #1a1e2f',
          }}
        />
      </span>
    </span>
  )
}
