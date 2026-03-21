# Flowline

Flowline is a personal productivity application that consolidates your to-do lists, habit tracking and scheduling into a single web experience.  
It is built with **Next.js** and **React** for the front-end, **Payload CMS** for the headless back-end and **Neon** for the serverless PostgreSQL database.  
Authentication is handled with **Better Auth**, allowing each user to have a private session and their own task data.  
The design uses **Tailwind CSS** and the **shadcn/ui** component library to deliver a clean, accessible interface.

## Table of contents

- [Highlights](#highlights)
- [Overview](#overview)
- [Application workflow](#application-workflow)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Key hooks](#key-hooks)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Author](#author)

## Highlights

- **User authentication with Better Auth**: each user has a secure session and private data.
- **Session-based tasks**: tasks are now linked to the authenticated user instead of being global.
- **Unified task and habit management**: organise your to-dos, track recurring habits and plan your agenda from one place.
- **Extensible architecture**: the project is structured for growth with separate folders for API logic, front-end pages, Payload collections and reusable components.
- **Modern tech stack**: built with Next.js, Payload CMS and Neon PostgreSQL; styled with Tailwind CSS and shadcn/ui components.
- **Collaborative workspaces (planned)**: create and share workspaces so that teams can coordinate schedules and tasks.
- **Analytics and habit trackers (planned)**: analyse your productivity trends with graphs and trackers.

## Overview

Flowline began as a personal project to learn full-stack web development.  
It currently provides a task management page where each authenticated user can manage their own tasks.

Authentication is implemented using **Better Auth**, which creates a session for each user.  
All tasks are stored in the database with a reference to the current session, meaning tasks are now user-specific instead of shared globally.

You can create tasks with a required title and optional description, complete tasks, move them to trash, and permanently delete them.  
The application is designed to grow into a full productivity suite including timers, an agenda, habit trackers, shared workspaces and category-based organisation.

### Application workflow

1. **Login / session creation**  
   The user signs in using Better Auth.  
   A session is created and all data is scoped to this session.

2. **Create tasks**  
   Click the **Create task** button to open a dialog.  
   Enter a title (required) and an optional description.  
   The task will be stored with the current user session.

3. **Complete or restore tasks**  
   Marking a task as completed moves it to the **Completed** list.  
   Unchecking restores it to the active list.

4. **Trash and deletion**  
   Clicking the trash icon moves a task to the **Trashed** list.  
   Tasks in Trash can be permanently deleted.

5. **Planned features**  
   Future versions will add timers, an agenda view, category management, analytics and shared workspaces.

## Tech Stack

| Layer            | Technology                              | Notes |
|------------------|-----------------------------------------|------|
| Front-end        | **Next.js** & **React**                 | Server + client rendering |
| Styling          | **Tailwind CSS** + **shadcn/ui**        | UI components |
| Back-end         | **Payload CMS**                         | API & collections |
| Database         | **Neon PostgreSQL**                     | Serverless DB |
| Auth             | **Better Auth**                         | Session-based authentication |
| State management | **React hooks**                         | UI + API state |

## Project Structure

| Folder         | Purpose |
|---------------|---------|
| `api/`        | API helpers and server functions |
| `app/`        | Next.js routing |
| `collections/`| Payload collections (tasks, users…) |
| `components/` | UI components |
| `hooks/`      | Custom React hooks |
| `lib/`        | Utilities |
| `auth/`       | Better Auth configuration |

### Key hooks

- **useTaskCreation**  
  Handles dialog state, validation and API calls.

- **useTask**  
  Handles status toggling and updates.

- **useSession**  
  Retrieves the current authenticated session and ensures tasks belong to the user.

## Usage

1. Sign in to create a session.
2. Create tasks linked to your account.
3. Complete / delete / restore tasks.
4. Each user only sees their own tasks.

## Roadmap

- Habit tracking
- Timers / Pomodoro
- Agenda
- Workspaces
- Analytics
- Shared projects

## Author

Sophie Wodey
