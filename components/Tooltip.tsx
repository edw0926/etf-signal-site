// Pure CSS tooltip — works in server components, no client JS needed
export default function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-block align-middle" tabIndex={0} style={{ outline: 'none' }}>
      <span
        className="cursor-help ml-0.5 select-none"
        style={{ color: 'var(--muted2)', fontSize: '10px', lineHeight: 1 }}
      >
        ⓘ
      </span>
      <span
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 z-20
                   opacity-0 group-hover:opacity-100 group-focus:opacity-100
                   transition-opacity duration-150"
        style={{
          background: '#131e2e',
          border: '1px solid rgba(255,255,255,.13)',
          borderRadius: '7px',
          padding: '8px 11px',
          fontSize: '10.5px',
          lineHeight: '1.6',
          color: '#b8c8e0',
          whiteSpace: 'normal',
          boxShadow: '0 4px 20px rgba(0,0,0,.55)',
        }}
      >
        {text}
        {/* 小三角箭頭 */}
        <span
          className="absolute left-1/2 -translate-x-1/2 top-full"
          style={{
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #131e2e',
          }}
        />
      </span>
    </span>
  )
}
