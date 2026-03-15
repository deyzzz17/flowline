# Flowline

Flowline is a personal productivity application that consolidates your to‑do lists, habit tracking and scheduling into a single web experience.  It is built with **Next.js** and **React** for the front‑end, **Payload CMS** for the headless back‑end and **Neon** for the serverless PostgreSQL database.  The design uses **Tailwind CSS** and the **shadcn/ui** component library to deliver a clean, accessible interface.

## Highlights

- **Unified task and habit management**: organise your to‑dos, track recurring habits and plan your agenda from one place.
- **Extensible architecture**: the project is structured for growth with separate folders for API logic, front‑end pages, Payload collections and reusable components.
- **Modern tech stack**: built with Next.js, Payload CMS and Neon PostgreSQL; styled with Tailwind CSS and shadcn/ui components.
- **Collaborative workspaces (planned)**: create and share workspaces so that teams can coordinate schedules and tasks.
- **Analytics and habit trackers (planned)**: analyse your productivity trends with graphs and trackers.

## Overview

Flowline began as a personal project to learn full‑stack web development.  It currently provides a single page where you can manage a list of tasks.  You can create tasks with a required title and optional description; complete tasks to move them into the completed list; temporarily delete them to a **Trash** list; and permanently delete items from the Trash.  The application is designed to grow into a full productivity suite including timers, an agenda, habit trackers, shared workspaces and category‑based organisation.

### Application workflow

1. **Create tasks**: click the **Create task** button to open a dialog.  Enter a title (required) and an optional description.  If you try to create a task without a title, the form will show a red error message.
2. **Complete or restore tasks**: marking a task as completed removes it from the active list and adds it to the **Completed** list.  Unchecking it will restore it to the active list.
3. **Trash and deletion**: clicking the trash icon moves a task to the **Trashed** list.  Clicking the trash icon on an item in **Trashed** permanently deletes it.
4. **Planned features**: future versions will add timers, an agenda view, category management, analytics and shared workspaces.

## Tech Stack

This project brings together several modern technologies:

| Layer            | Technology                              | Notes |
|------------------|-----------------------------------------|------|
| Front‑end        | **Next.js** & **React**                 | Provides server‑side rendering and client‑side interactivity. |
| Styling          | **Tailwind CSS** + **shadcn/ui**        | Utility‑first CSS with pre‑built accessible components. |
| Back‑end         | **Payload CMS**                         | Headless CMS used to define collections and handle API requests. |
| Database         | **Neon** (Postgres)                     | Serverless PostgreSQL database.  Connection strings have the form `postgres://<user>:<password>@<endpoint>.neon.tech:<port>/<db>?sslmode=require&channel_binding=require`:contentReference[oaicite:0]{index=0}. |
| State management | **React hooks**                          | Custom hooks manage UI state and API calls. |

## Project Structure

The core of the project lives in the `src/` directory and is organised for clarity:

| Folder         | Purpose |
|---------------|---------|
| `api/`        | Custom functions that wrap the Payload CMS API and handle server‑side database interactions. |
| `app/`        | Next.js pages and routing; this is the front‑end of the application. |
| `collections/`| Payload collection definitions for tasks and other data models. |
| `components/` | Reusable UI components.  The `ui/` subfolder contains shadcn/ui components; other components are custom. |
| `hooks/`      | Custom React hooks such as `useTaskCreation` and `useTask` to encapsulate state and side‑effects. |
| `lib/`        | Utility functions and helper modules (currently untouched). |

### Key hooks

Two custom hooks drive the task form and task status toggling:

1. **useManageForm / useTaskCreation**: manages the visibility of the task dialog and handles the form state.  The hook enforces that the title is not empty, sets a loading state while the API call is in progress, and resets the form when the task is saved successfully.
2. **useTask**: exposes a `toggleStatus` function to mark tasks as completed or active.  It sets a flag while the API request is pending.

## Getting Started

Follow these steps to run Flowline locally:

### 1. Prerequisites

Ensure you have the following installed:

- **Node.js** 18 or later:contentReference[oaicite:1]{index=1}.
- A **package manager** such as `npm`, `pnpm` or `yarn`.  pnpm is recommended.
- A **Neon** account and PostgreSQL database.  You can create a serverless Postgres instance in the Neon console and enable connection pooling.  Note that Neon connection strings follow the format `postgres://<user>:<password>@<endpoint_hostname>.neon.tech:<port>/<dbname>?sslmode=require&channel_binding=require`:contentReference[oaicite:2]{index=2}.  You will use this connection string in your environment variables.

### 2. Clone the repository

```bash
git clone https://github.com/your‑username/flowline.git
cd flowline
```

### 3. Install dependencies

Use your preferred package manager to install the project’s dependencies:

```bash
# Using pnpm
pnpm install

# or using npm
npm install

# or using yarn
yarn install
```

### 4. Configure environment variables

Create a `.env` file in the project root.  This file holds sensitive values such as your database connection string and secret keys.  Payload CMS uses environment variables for configuration, and Next.js will automatically load them from `.env`:contentReference[oaicite:3]{index=3}.

Example `.env`:

```env
# Base URL of your server
SERVER_URL=http://localhost:3000

# Database connection string from your Neon project
DATABASE_URL=postgres://<user>:<password>@<endpoint_hostname>.neon.tech:<port>/<dbname>?sslmode=require&channel_binding=require

# Secret used by Payload for signing session cookies
PAYLOAD_SECRET=replace-this-with-a-long-random-string

# Optional: variables exposed to the client; prefix with NEXT_PUBLIC_
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

You can access these variables in your Payload configuration using `process.env`:contentReference[oaicite:4]{index=4}.  When exposing variables to client‑side code, prefix them with `NEXT_PUBLIC_`:contentReference[oaicite:5]{index=5}.  **Avoid exposing secrets to the client.**

### 5. Run the development server

Start the application in development mode:

```bash
pnpm run dev
# or
npm run dev
# or
yarn dev
```

By default, the app runs on `http://localhost:3000`.  Payload CMS serves its admin panel at `/admin`, which you can access in your browser.

### 6. Seed the database (optional)

Flowline does not require seeding, but if you wish to pre‑populate your database, you can create entries through the admin panel.  Log into the Payload admin UI at `http://localhost:3000/admin`, define your user and begin adding tasks.

## Usage

Once the server is running, open your browser to `http://localhost:3000`.

1. **Create a new task**: click the “Create task” button.  A modal dialog appears; fill in the title and optional description.  If the title is empty, a red validation message will appear above the input.
2. **Mark tasks as completed**: in the active to‑do list, click the check box next to a task to mark it as completed.  Completed tasks will move to the **Completed** list.  Unchecking a completed task returns it to the active list.
3. **Delete tasks**: click the trash icon on a task to send it to the **Trashed** list.  Tasks in the **Trashed** list can be permanently removed by clicking the trash icon again.
4. **Navigate between lists**: toggle between “Active”, “Completed” and “Trashed” views to manage tasks in different states.

## Roadmap

The first version of Flowline implements core task management.  Planned features include:

- **Habit tracking**: create recurring habits and monitor streaks and progress with graphs.
- **Agenda view**: integrate calendar events to visualise your schedule and plan ahead.
- **Timers and productivity tools**: incorporate Pomodoro timers and focus tools.
- **Workspace management**: create shared workspaces, invite colleagues and categorise tasks by project or team.
- **Analytics**: view detailed statistics on completed tasks, habits and productivity trends.

## Author

Sophie Wodey
