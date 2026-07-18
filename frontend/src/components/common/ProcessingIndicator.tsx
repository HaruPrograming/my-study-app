import { useEffect } from 'react'
import { useStudyContext } from '../../context/StudyContext'

export function ProcessingIndicator() {
  const { processingUploads, failedUploads, dismissFailedUpload } = useStudyContext()

  // 8秒後に自動消去
  useEffect(() => {
    if (failedUploads.length === 0) return
    const timers = failedUploads.map(u =>
      setTimeout(() => dismissFailedUpload(u.uploadId), 8000)
    )
    return () => timers.forEach(clearTimeout)
  }, [failedUploads, dismissFailedUpload])

  if (processingUploads.length === 0 && failedUploads.length === 0) return null

  const processingLabel = processingUploads.length === 1
    ? processingUploads[0].examLabel
    : `${processingUploads.length}件`

  return (
    <div className="fixed top-3 right-3 z-50 flex flex-col gap-2">
      {processingUploads.length > 0 && (
        <div className="flex items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: '#fff', border: '1.5px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
          <div className="w-3.5 h-3.5 rounded-full border-2"
            style={{ borderColor: 'var(--surface2)', borderTopColor: 'var(--accent)', animation: 'spin .8s linear infinite' }} />
          <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
            {processingLabel} 解析中…
          </span>
        </div>
      )}
      {failedUploads.map(u => (
        <div key={u.uploadId} className="flex items-start gap-2 rounded-[12px] px-3 py-2.5 max-w-[220px]"
          style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
          <span className="text-[13px] leading-none mt-0.5">❌</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold mb-0.5" style={{ color: '#DC2626' }}>
              {u.examLabel} 生成失敗
            </div>
            <div className="text-[10px] leading-relaxed" style={{ color: '#991B1B' }}>
              {u.errorMessage}
            </div>
          </div>
          <button
            onClick={() => dismissFailedUpload(u.uploadId)}
            className="text-[14px] leading-none flex-shrink-0"
            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0 }}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
