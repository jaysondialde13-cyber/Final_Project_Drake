# Smart To-Do

Smart To-Do is a task-management web application that helps users organize their daily work and decide what to do first. Along with standard task tracking, it uses Google Gemini AI to suggest a priority order based on each active task's deadline and importance.

Created by **Jayson M. Dialde**, 3rd Year BSIT student at **St. Paul University Surigao**.

## What the app does

Users can create tasks with a title, optional description, due date, and importance level. The dashboard provides a quick view of active, completed, overdue, and high-importance tasks. Tasks can be searched, filtered, edited, completed, deleted, and restored with Undo.

The app also includes light and dark themes and displays helpful focus tips for planning a productive day.

## How AI prioritization works

1. Add one or more active tasks, including their due dates and importance levels.
2. Select **Prioritize with Gemini**.
3. The app sends only the incomplete tasks to Gemini.
4. Gemini returns a ranked priority for every task, with a short reason for each recommendation.
5. Each task receives an **AI #** badge. Choose **Gemini priority** in the Sort menu to display the tasks in Gemini's recommended order.

Gemini's recommendations consider deadlines and importance, but the user remains in control of their tasks and final decisions.

## Technologies used

- **React** for the user interface
- **Vite** for development and production builds
- **JavaScript** and **CSS** for application behavior and styling
- **Google Gemini API** through `@google/genai` for AI task prioritization
- **Lucide React** for interface icons
- **Browser Local Storage** to save tasks and theme preferences on the device

## Running the project locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file and add your Gemini API key:

   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local URL shown in the terminal.

## Deploying to Netlify

This app reads `VITE_GEMINI_API_KEY` during the Vite build. A local `.env.local` file is not uploaded to Netlify.

1. In Netlify, open the site and go to **Project configuration > Environment variables**.
2. Add `VITE_GEMINI_API_KEY` with your Gemini API key. Apply it to the deploy contexts you use, such as **Production**.
3. Trigger a new deploy with **Deploys > Trigger deploy > Deploy site**.

The variable must be present before the build starts. Do not commit `.env.local` or put the API key in source control. Because `VITE_` variables are included in browser JavaScript, use a serverless/backend proxy for a production app where the key must remain private.

## Important note

The Gemini API key is intended for local development. For a deployed production app, API requests should go through a secure backend or serverless function so the key is not exposed in the browser.
