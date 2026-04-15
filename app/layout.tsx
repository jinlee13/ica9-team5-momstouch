import type { Metadata } from 'next'
import './globals.css'
import ChatFloatButton from '@/components/chat/ChatFloatButton'

export const metadata: Metadata = {
  title: '똑똑한 엄마',
  description: '아이 개월 수에 딱 맞는 육아용품 추천 서비스',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        {children}
        <ChatFloatButton />
      </body>
    </html>
  )
}
