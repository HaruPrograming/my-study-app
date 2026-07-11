import { KeyboardIcon, CPUIcon, MonitorDisplayIcon, MemoryIcon, StorageIcon } from '../icons'

type IllustNode = { icon: string; label: string; highlight?: boolean }
type Props = {
  nodes: IllustNode[]
  subNodes?: IllustNode[]
  caption: string
}

function NodeIcon({ icon, highlight }: { icon: string; highlight?: boolean }) {
  const color = highlight ? 'rgba(255,255,255,0.95)' : 'var(--accent)'
  const size = 28
  switch (icon) {
    case 'keyboard': return <KeyboardIcon size={size} color={color} />
    case 'cpu':      return <CPUIcon      size={size} color={color} />
    case 'monitor':  return <MonitorDisplayIcon size={size} color={color} />
    default: return null
  }
}

function SubNodeIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'memory':  return <MemoryIcon  size={22} color="var(--orange)" />
    case 'storage': return <StorageIcon size={22} color="var(--orange)" />
    default: return null
  }
}

export function IllustBlock({ nodes, subNodes, caption }: Props) {
  return (
    <div className="rounded-[16px] overflow-hidden mb-3.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="px-4 pt-4 pb-3.5 flex flex-col items-center gap-3"
        style={{ background: 'linear-gradient(135deg,#EAF5EC,#F2F9F4)' }}>
        <div className="flex items-center gap-1.5">
          {nodes.map((node, i) => (
            <div key={node.icon} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[17px]" style={{ color: 'var(--accent)' }}>→</span>}
              <div className="flex flex-col items-center gap-1 rounded-[12px] px-[11px] py-2.5 min-w-[58px]"
                style={node.highlight
                  ? { background: 'var(--accent)', border: '1.5px solid var(--accent)', transform: 'scale(1.07)', boxShadow: '0 4px 12px var(--accent-glow)' }
                  : { background: '#fff', border: '1.5px solid var(--border)' }}>
                <NodeIcon icon={node.icon} highlight={node.highlight} />
                <div className="text-[8px] font-bold text-center whitespace-pre-line"
                  style={{ color: node.highlight ? 'rgba(255,255,255,0.85)' : 'var(--muted)' }}>
                  {node.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {subNodes && subNodes.length > 0 && (
          <div className="flex flex-col items-center gap-1.5">
            <div className="text-[10px] font-bold" style={{ color: 'var(--orange)' }}>＋ 記憶装置</div>
            <div className="flex gap-2 items-center">
              {subNodes.map((sn, i) => (
                <div key={sn.icon} className="flex items-center gap-2">
                  {i > 0 && <span className="text-[13px]" style={{ color: 'var(--muted)' }}>＋</span>}
                  <div className="flex flex-col items-center gap-0.5 rounded-[10px] px-2.5 py-1.5"
                    style={{ background: '#fff', border: '1.5px solid rgba(245,124,43,0.25)' }}>
                    <SubNodeIcon icon={sn.icon} />
                    <div className="text-[8px] font-bold" style={{ color: 'var(--orange)' }}>{sn.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-[12px] leading-relaxed text-center px-4 py-[11px]"
        style={{ color: 'var(--muted)', background: '#fff', borderTop: '1px solid var(--border)' }}
        dangerouslySetInnerHTML={{ __html: caption.replace(/<b>/g, '<strong style="color:var(--accent)">').replace(/<\/b>/g, '</strong>').replace(/<span class="oi">/g, '<span style="color:var(--orange);font-weight:700">') }} />
    </div>
  )
}
