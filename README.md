# TaskFlow – AI Meeting Minutes to Task Converter

TaskFlow is a smart task manager that uses AI to convert natural language meeting minutes into actionable tasks. Enter your meeting notes, and TaskFlow will automatically extract tasks, assignees, due dates, and priorities.

## Features

- **AI-powered natural language parsing** for task extraction
- **Automatic assignee, due date, and priority detection**
- **Modern, responsive UI** built with React and Tailwind CSS
- **Express.js backend** for API and task management
- **Persistent storage** (in-memory or database-ready)
- **Easy task editing, sorting, and filtering**


## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <repo-folder>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Running the App (Development)

Start both the backend and frontend (served together):

```bash
npm run dev
```

- The app will be available at [http://localhost:5000](http://localhost:5000)

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. Enter your meeting minutes or task instructions in natural language.
2. The AI will parse and display tasks, assignees, due dates, and priorities.
3. Review, edit, and manage your tasks from the dashboard.

**Example Input:**
```
Aman you take the landing page by 10pm tomorrow. Rajeev you take care of client follow-up by Wednesday. Shreya please review the marketing deck tonight.
```

## Customization

- **Natural Language Parsing:**  
  The parsing logic is in `client/src/lib/natural-language-parser.ts`. You can enhance or adjust the extraction rules as needed.

- **Styling:**  
  Tailwind CSS is used for styling. Adjust `tailwind.config.ts` as needed.

## Scripts

- `npm run dev` – Start the app in development mode
- `npm run build` – Build the app for production
- `npm start` – Start the production server
- `npm run check` – Type-check the codebase

## License

MIT 