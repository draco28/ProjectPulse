# Sprint 13: Notifications & Activity System

**Duration**: 2 weeks
**Focus**: Enable awareness without real-time sync
**Status**: Planned

---

## Overview

Sprint 13 implements a polling-based notification system that keeps users informed about relevant activity without requiring WebSocket infrastructure.

Features:
1. **Notification System** - In-app notification center with bell icon
2. **@Mentions** - Tag users in comments with autocomplete
3. **Activity Feed** - Timeline of ticket and project activity

---

## Feature 1: Notification System

**Estimated Effort**: 5 days
**Linear Equivalent**: Notifications with inbox and preferences

### Requirements

1. Support notification types:
   - `MENTION` - Someone @mentioned you
   - `ASSIGNMENT` - Ticket assigned to you
   - `STATUS_CHANGE` - Ticket you're watching changed status
   - `COMMENT` - New comment on ticket you're watching
   - `RELATION` - Blocking/blocked ticket updated

2. In-app notification center (bell icon in header)
3. Unread badge with count
4. Mark as read (individual and all)
5. 30-second polling for new notifications (no WebSockets)

### Database Schema

```prisma
model Notification {
  id          String   @id @default(cuid())

  // Recipient
  userId      Int
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Notification type and content
  type        NotificationType
  title       String
  body        String?

  // Related entities
  ticketId    Int?
  ticket      Ticket?  @relation(fields: [ticketId], references: [id], onDelete: SetNull)

  projectId   Int?
  project     Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)

  // Actor (who triggered the notification)
  actorId     Int?
  actor       User?    @relation("NotificationActor", fields: [actorId], references: [id], onDelete: SetNull)
  actorName   String?  // Fallback if actor deleted

  // State
  isRead      Boolean  @default(false)
  readAt      DateTime?

  // Metadata
  metadata    Json?    // Additional context (e.g., old/new status)

  createdAt   DateTime @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@index([ticketId])
}

enum NotificationType {
  MENTION
  ASSIGNMENT
  STATUS_CHANGE
  COMMENT
  RELATION
  TICKET_CREATED
  TICKET_BLOCKED
}
```

### API Endpoints

```
GET    /api/notifications              - List notifications (paginated)
GET    /api/notifications/unread-count - Get unread count (for polling)
POST   /api/notifications/[id]/read    - Mark single as read
POST   /api/notifications/read-all     - Mark all as read
DELETE /api/notifications/[id]         - Delete notification
```

### Files to Create/Modify

- `apps/web/prisma/schema.prisma` - Add Notification model
- `apps/web/app/api/notifications/route.ts` (new) - List, mark-read
- `apps/web/app/api/notifications/unread-count/route.ts` (new) - Polling endpoint
- `apps/web/components/NotificationCenter.tsx` (new) - Bell + dropdown
- `apps/web/components/NotificationItem.tsx` (new) - Single notification
- `apps/web/hooks/useNotifications.ts` (new) - Polling hook
- `apps/web/app/layout.tsx` - Add NotificationCenter to header
- `apps/web/lib/notifications.ts` (new) - Create notification helper

### Notification Creation Helper

```typescript
// apps/web/lib/notifications.ts
export async function createNotification({
  userId,
  type,
  title,
  body,
  ticketId,
  projectId,
  actorId,
  metadata
}: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      ticketId,
      projectId,
      actorId,
      actorName: actorId ? (await prisma.user.findUnique({ where: { id: actorId } }))?.name : null,
      metadata
    }
  });
}

// Usage in ticket assignment
await createNotification({
  userId: newAssigneeId,
  type: 'ASSIGNMENT',
  title: `You were assigned to ${ticket.title}`,
  ticketId: ticket.id,
  projectId: ticket.projectId,
  actorId: currentUserId,
});
```

### Polling Implementation

```typescript
// apps/web/hooks/useNotifications.ts
export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll every 30 seconds
  useEffect(() => {
    const poll = async () => {
      const res = await fetch('/api/notifications/unread-count');
      const { count } = await res.json();
      setUnreadCount(count);
    };

    poll(); // Initial fetch
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  return { unreadCount };
}
```

### UI Design

```
┌─────────────────────────────────────────────┐
│  🔔 (3)  ←── Bell with unread badge         │
└─────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│ Notifications          [Mark all as read]   │
├─────────────────────────────────────────────┤
│ • @john mentioned you in PROJ-123           │
│   "Can you review the auth changes?"        │
│   2 minutes ago                             │
├─────────────────────────────────────────────┤
│ • You were assigned to PROJ-456             │
│   by Sarah                                  │
│   15 minutes ago                            │
├─────────────────────────────────────────────┤
│ • PROJ-789 status changed                   │
│   In Progress → Done                        │
│   1 hour ago                          [···] │
└─────────────────────────────────────────────┘
```

---

## Feature 2: @Mentions in Comments

**Estimated Effort**: 2 days
**Linear Equivalent**: @mentions in comments and descriptions

### Requirements

1. Type `@` to trigger user autocomplete dropdown
2. Parse @username from comment content
3. Create notification when user is mentioned
4. Linkify mentions in rendered comments

### Implementation

```typescript
// apps/web/lib/mentions.ts
const MENTION_REGEX = /@(\w+)/g;

export function parseMentions(content: string): string[] {
  const matches = content.matchAll(MENTION_REGEX);
  return [...matches].map(m => m[1]);
}

export function renderMentions(content: string, users: User[]): string {
  return content.replace(MENTION_REGEX, (match, username) => {
    const user = users.find(u => u.username === username);
    if (user) {
      return `<span class="mention" data-user-id="${user.id}">@${username}</span>`;
    }
    return match;
  });
}
```

### Files to Create/Modify

- `apps/web/lib/mentions.ts` (new) - Parse and render mentions
- `apps/web/components/tickets/CommentEditor.tsx` - Add autocomplete
- `apps/web/components/MentionAutocomplete.tsx` (new) - Dropdown component
- `apps/web/app/api/tickets/[id]/comments/route.ts` - Create notifications on mention
- `apps/web/app/api/users/search/route.ts` (new) - Search users for autocomplete

### Autocomplete Component

```typescript
// apps/web/components/MentionAutocomplete.tsx
export function MentionAutocomplete({
  query,
  onSelect,
  projectId
}: Props) {
  const { data: users } = useSWR(
    query ? `/api/users/search?q=${query}&projectId=${projectId}` : null
  );

  if (!query || !users?.length) return null;

  return (
    <div className="mention-autocomplete">
      {users.map(user => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className="mention-option"
        >
          <Avatar src={user.avatar} size="sm" />
          <span>{user.name}</span>
          <span className="text-muted">@{user.username}</span>
        </button>
      ))}
    </div>
  );
}
```

### UI Flow

1. User types `@` in comment editor
2. Autocomplete dropdown appears
3. User types to filter, arrow keys to navigate
4. Enter or click to select
5. `@username` inserted in editor
6. On submit, mentions parsed and notifications created

---

## Feature 3: Activity Feed

**Estimated Effort**: 1 day
**Linear Equivalent**: Activity tab on issues

### Requirements

1. Ticket-level activity timeline
2. Track: status changes, comments, assignments, relations
3. Chronological order (newest first option)
4. Actor and timestamp for each event

### Existing Infrastructure

We already have `TicketActivityLog` model:

```prisma
model TicketActivityLog {
  id          String   @id @default(cuid())
  ticketId    Int
  ticket      Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  action      String   // "status_change", "comment_added", "assigned", etc.
  actorId     Int?
  actorType   String?  // "human", "agent", "system"
  actorName   String?

  oldValue    String?
  newValue    String?
  metadata    Json?

  createdAt   DateTime @default(now())
}
```

### Files to Modify

- `apps/web/components/tickets/ActivityTimeline.tsx` - Enhance existing component
- `apps/web/app/api/tickets/[id]/activity/route.ts` - Add pagination
- `apps/web/components/tickets/TicketDetail.tsx` - Add Activity tab

### Enhanced Activity Timeline

```
┌─────────────────────────────────────────────┐
│ Activity                                    │
├─────────────────────────────────────────────┤
│ 🔵 Status changed to In Progress            │
│    by John • 2 hours ago                    │
│                                             │
│ 💬 Comment added                            │
│    "Starting work on this now"              │
│    by John • 2 hours ago                    │
│                                             │
│ 👤 Assigned to John                         │
│    by Sarah • 3 hours ago                   │
│                                             │
│ ➕ Ticket created                           │
│    by Sarah • 1 day ago                     │
└─────────────────────────────────────────────┘
```

---

## Integration Points

### When to Create Notifications

| Event | Notification Type | Recipients |
|-------|-------------------|------------|
| Ticket assigned | `ASSIGNMENT` | New assignee |
| Comment added | `COMMENT` | Watchers, assignee |
| Status changed | `STATUS_CHANGE` | Watchers, assignee |
| @mention | `MENTION` | Mentioned user |
| Blocked by ticket | `TICKET_BLOCKED` | Assignee of blocked ticket |
| Blocking ticket resolved | `RELATION` | Assignee of previously blocked |

### Ticket Watchers

Add watching capability:

```prisma
model TicketWatcher {
  id        String   @id @default(cuid())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([ticketId, userId])
}
```

Auto-watch when:
- User creates ticket
- User is assigned
- User comments
- User explicitly subscribes

---

## Success Criteria

- [ ] Notification center accessible from header
- [ ] Unread badge showing count
- [ ] Mark-read and mark-all-read working
- [ ] Polling every 30 seconds for new notifications
- [ ] @mentions parsed in comments
- [ ] Mention autocomplete working with user search
- [ ] Notifications created on mention
- [ ] Activity feed showing ticket history
- [ ] Activity includes: status changes, comments, assignments

---

## Dependencies

- Sprint 12 (Issue Relations) - for relation notifications
- Existing `User` model with username field
- Existing `TicketActivityLog` model

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Polling overhead | Use lightweight unread-count endpoint |
| Notification spam | Add notification preferences later |
| Mention parsing edge cases | Thorough regex testing |
