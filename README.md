# Flowline – Next.js + Payload CMS + Neon

**Flowline** is a modern productivity ecosystem designed to streamline task management, habit tracking, and time analysis into one seamless workflow.

Built with a robust backend using **Payload CMS** and **PostgreSQL (Neon)**, Flowline moves beyond simple local storage to provide a persistent, scalable, and data-driven experience.

---

## Overview

Flowline is designed for users who need more than just a basic checklist. The application aims to bridge the gap between simple task organization and deep productivity analytics.

Currently, the project focuses on a core task management system with a sophisticated lifecycle, preparing the ground for upcoming features like habit streaks and time-tracking dashboards.

---

## Current Features (MVP)

### Smart Task Lifecycle
The application organizes tasks into three distinct functional lists:

**Todo List**
- Active tasks currently in progress.
- Clean UI for quick creation and overview.

**Completed Tasks**
- Archive of finished objectives.
- Provides a sense of accomplishment and history.

**Trash (Soft Delete)**
- Acting as a safety net, deleted tasks from "Todo" or "Completed" move here first.
- **Permanent Deletion:** Tasks can only be permanently erased from the database once they are in the Trash.
- **Restoration:** (Work in Progress) System to return tasks to their original lists.

### Task Management
- **Creation:** Users can create tasks via a dedicated form.
- **Validation:** Title is a required field; Description is optional.
- **Persistence:** All data is securely stored in a PostgreSQL database via Neon, ensuring your data is available across sessions and devices.

---

## Future Roadmap

Flowline is evolving into an all-in-one productivity suite:

- [ ] **Habit Tracker:** Build and monitor daily routines with streak visualizations.
- [ ] **Advanced Analytics:** Data-driven insights into task completion trends and habit consistency.
- [ ] **Time Tracking:** Integrated timer to track work sessions per category.
- [ ] **User Accounts:** Full authentication system with personalized workspaces.
- [ ] **Category Management:** Custom labels and filtering for tasks and habits.

---

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Backend & Admin Panel:** [Payload CMS 3.0](https://payloadcms.com/)
- **Database:** [Neon](https://neon.tech/) (Serverless PostgreSQL)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Heroicons](https://heroicons.com/)

---

## Project Structure

The project follows a modular architecture separating the CMS schemas, the frontend UI, and the server logic:

```text
src/
 ├── api/              # Actions with DB
 ├── app/              # Next.js routes and page logic
 ├── collections/      # Payload CMS Data Models (Tasks, Users)
 ├── components/       # UI library (shadcn + custom components)
 ├── hooks/            # Custom React Hooks for specialized logic (Tasks, UI states)
 ├── lib/              # Database & Payload configurations
 └── styles/           # Global styles and Tailwind config
 ```
 
 ## Installation
 
 ### Clone the repository
 
 ```bash
 git clone <your-repository-url>
 cd flowline
 ```
 
 ### Install dependencies
 
 ```bash
 npm install 
 ```
 
 ### Environnement Setup
 
 Create a .env file in the root directory and add your credentials: 
 
 ```bash
 DATABASE_URI=postgres://user:password@endpoint/dbname
 PAYLOAD_SECRET=your_payload_secret_here
 NEXT_PUBLIC_SERVER_URL=http://localhost:3000
 ```
 
 ### Run in development
 
 ```bash
 npm run dev
 ```
 
 ## Author
 
 Sophie Wodey
