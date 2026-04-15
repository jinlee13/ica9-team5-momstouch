// components/chat/ChatMessage.tsx
'use client'

interface Props {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export default function ChatMessage({ role, content, isStreaming }: Props) {
  const isUser = role === 'user'

  // **굵게** 마크다운 파싱
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  const formatted = escapeHtml(content).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
             style={{ backgroundColor: '#9B7EDE', color: 'white' }}>
          AI
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'text-white rounded-br-sm'
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
        }`}
        style={isUser ? { backgroundColor: '#9B7EDE' } : {}}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
      {isStreaming && (
        <span className="ml-2 mt-3 flex gap-1 items-center">
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      )}
    </div>
  )
}
