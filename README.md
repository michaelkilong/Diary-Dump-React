# Diary Dump

A living bridge of thoughts. Leave a lock, share a memory, hang a secret. No sign-in required.

## Architecture

- **Public Wall** — `https://diary-dump.vercel.app/` — Anyone can hang a lock without signing in.
- **Personal Spaces** — `https://diary-dump.vercel.app/space/:username` — Public but "specifically for them". Anyone who knows the URL can view and leave notes.

## Tech Stack

- React 18 + Vite
- React Router v6
- Firebase Firestore (real-time)
- Font Awesome icons
- CSS custom properties + glassmorphism

## Setup

1. Create a Firebase project → [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Copy `.env.example` to `.env` and fill in your Firebase credentials
4. Set Firestore security rules (see below)
5. Deploy to Vercel

```bash
npm install
npm run dev
```

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /publicNotes/{noteId} {
      allow read: if true;
      allow create: if request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() < 50
        && request.resource.data.message is string
        && request.resource.data.message.size() > 0
        && request.resource.data.message.size() < 500
        && request.resource.data.x is number
        && request.resource.data.y is number;
      allow update, delete: if false;
    }
    match /spaces/{spaceId} {
      allow read: if true;
      allow create: if request.resource.data.displayName is string
        && request.resource.data.username is string;
      allow update, delete: if false;
    }
    match /spaces/{spaceId}/notes/{noteId} {
      allow read: if true;
      allow create: if request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.message is string
        && request.resource.data.message.size() > 0
        && request.resource.data.message.size() < 500
        && request.resource.data.x is number
        && request.resource.data.y is number;
      allow update, delete: if false;
    }
  }
}
```

## Deploy to Vercel

```bash
npm run build
# Push to GitHub, import to Vercel
# Framework preset: Vite
```

The `vercel.json` rewrite rule ensures SPA routing works correctly.

## Features

- **Infinite pan & zoom** — Drag to move, scroll/pinch to zoom
- **Hang a Lock** — Click anywhere on the bridge to place a note
- **Real-time sync** — Notes appear instantly via Firestore
- **View counter** — Tracks how many times a lock has been opened
- **Reactions** — Heart, Fire, Smile, Tear reactions on each lock
- **Share button** — Copy the bridge URL to share with anyone
- **Sidebar menu** — Navigate between Public Wall and personal spaces
- **Create Space** — Make a dedicated bridge with a custom display name and username
- **No sign-in** — No email, no password, no friction

## License

MIT
