import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6"
      style={{ background: 'linear-gradient(160deg,#2E9E5B,#1A6E3C)' }}>
      <div className="w-full max-w-[320px] flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="text-[36px] font-black text-white mb-2">ときトレ</div>
          <div className="text-[14px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
            資格試験の学習をサポートします
          </div>
        </div>

        <div className="w-full rounded-[16px] p-6 flex flex-col gap-4"
          style={{ background: 'rgba(255,255,255,0.12)' }}>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 rounded-[12px] py-3.5 text-[15px] font-bold"
            style={{ background: '#fff', color: '#1A2E1E' }}>
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <path d="M43.611 20.083H42V20H24v8h11.303C33.98 31.97 29.387 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.807 0 5.365 1.057 7.307 2.779l5.657-5.657C33.763 7.418 29.106 5 24 5 13.507 5 5 13.507 5 24s8.507 19 19 19c9.954 0 18.5-7.7 18.5-19 0-1.274-.132-2.518-.389-3.917z" fill="#FFC107"/>
              <path d="M6.306 14.691l6.571 4.819C14.655 16.108 19.003 13 24 13c2.807 0 5.365 1.057 7.307 2.779l5.657-5.657C33.763 7.418 29.106 5 24 5c-7.682 0-14.344 4.337-17.694 10.691z" fill="#FF3D00"/>
              <path d="M24 43c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 34.091 26.715 35 24 35c-5.37 0-9.948-3.004-11.29-7.044l-6.522 5.025C9.505 39.556 16.227 43 24 43z" fill="#4CAF50"/>
              <path d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.533 44 30.13 44 24c0-1.274-.132-2.518-.389-3.917z" fill="#1976D2"/>
            </svg>
            Google でログイン
          </button>
        </div>
      </div>
    </div>
  )
}
