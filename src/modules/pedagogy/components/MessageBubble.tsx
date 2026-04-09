import type { ClassMessage } from '../types';

interface MessageBubbleProps {
  message: ClassMessage;
  isOwn: boolean;
  authorName: string;
}

export function MessageBubble({ message, isOwn, authorName }: Readonly<MessageBubbleProps>) {
  return (
    <div className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      {!isOwn && (
        <span className="px-1 text-xs font-medium text-muted-foreground">{authorName}</span>
      )}
      <div
        className={[
          'max-w-xs rounded-2xl px-4 py-2.5 text-sm lg:max-w-md',
          isOwn
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground',
        ].join(' ')}
      >
        {message.contenu}
      </div>
      <span className="px-1 text-xs text-muted-foreground">
        {new Date(message.created_at).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}
