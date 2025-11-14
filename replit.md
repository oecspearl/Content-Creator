# EduCreate - Interactive Educational Content Creator

## Overview

EduCreate is a full-stack web application designed for educators to create, manage, and share interactive educational content. The platform supports four main content types: quizzes, flashcards, interactive videos, and image hotspots. Content creation is enhanced with AI-powered generation capabilities using OpenAI's GPT models.

The application enables educators to build engaging learning materials, preview them in real-time, publish content for public access, and share educational resources with students and other educators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- React Router (Wouter) for client-side routing with protected route patterns
- Material Design 3 principles with Tailwind CSS for consistent, productivity-focused UI

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management, caching, and data synchronization
- Custom auth context provider for global authentication state
- Session-based authentication with automatic token refresh

**Component Library**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component system built on top of Radix UI with Tailwind styling
- Custom content player components for each interactive content type (quiz, flashcard, video, image hotspot)

**Design System**
- Typography: Inter for UI/body text, JetBrains Mono for code
- Consistent spacing using Tailwind's spacing scale (2, 4, 6, 8, 12, 16, 20)
- Theme system supporting light/dark modes with CSS custom properties
- Responsive grid layouts for content library and creator interfaces

### Backend Architecture

**Server Framework**
- Express.js for RESTful API endpoints
- Session-based authentication using express-session
- Custom middleware for request logging and authentication guards

**API Structure**
- `/api/auth/*` - Authentication endpoints (register, login, logout, session verification)
- `/api/content/*` - CRUD operations for educational content
- `/api/content/:id/share` - Content sharing and publication
- `/api/preview/:id` - Public content preview without authentication
- `/api/generate/*` - AI-powered content generation endpoints

**Authentication & Authorization**
- bcrypt for password hashing with salt rounds
- Session-based auth with httpOnly cookies for security
- Role-based access (teacher, student, admin) stored in user profiles
- Protected routes requiring valid session middleware

**Content Management**
- Four content types with JSON-based data storage: quiz, flashcard, interactive-video, image-hotspot
- Publication workflow: draft → published (public access enabled)
- Share link generation for published content

### Data Storage

**Database System**
- PostgreSQL via Neon serverless driver for scalable cloud database
- Drizzle ORM for type-safe database queries and schema management
- Schema migration support via drizzle-kit

**Database Schema**
- `profiles` - User accounts with authentication credentials and metadata
- `h5p_content` - Educational content with type-specific JSON data structures
- `content_shares` - Share tracking for published content

**Data Modeling Approach**
- JSONB columns for flexible content structure (supports different content types without schema changes)
- Foreign key relationships with cascade deletes for data integrity
- UUID primary keys for distributed systems compatibility
- Timestamp tracking for created/updated audit trails

### External Dependencies

**AI Integration**
- OpenAI API (GPT-5 model) for intelligent content generation
- Content types supported: quiz questions, flashcard pairs, video hotspots, image hotspots
- Structured JSON output with response formatting for predictable parsing
- Configurable generation parameters: topic, difficulty, grade level, number of items, language, additional context

**Database Service**
- Neon PostgreSQL serverless database with connection pooling
- Environment-based configuration via DATABASE_URL
- Automatic connection management through Drizzle ORM

**Font Delivery**
- Google Fonts CDN for Inter and JetBrains Mono font families
- Preconnect optimization for faster font loading

**Development Tools**
- Replit-specific plugins for runtime error overlay, cartographer, and dev banner
- TypeScript compiler for type checking across client/server/shared code

**Session Storage**
- In-memory session storage for development
- Configurable for production session stores (Redis, PostgreSQL via connect-pg-simple)

**Build & Deployment**
- esbuild for server-side bundling (ESM format, platform: node)
- Vite for client-side bundling with code splitting
- Support for static hosting platforms (Vercel, Netlify, Cloudflare Pages)