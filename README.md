# Verity App

**AI Resume Analyzer**

The Verity App is a powerful, locally-run web application that leverages the Google Gemini AI to analyze resumes against specific job descriptions. It provides a detailed breakdown of candidate suitability, helping users to quickly identify strengths, weaknesses, and keyword alignment. All data is stored privately in the user's browser, ensuring complete confidentiality.

---

## Application Specification

### 1. High-Level Overview

The **Verity App** is a web application designed to help job seekers and hiring professionals evaluate how well a resume matches a specific job description, acting as an **AI Resume Analyzer**.

The core workflow is job-centric. Users first create and save distinct "Jobs," each with a title and description. They can then select a job and analyze multiple resumes against it. The application uses the Google Gemini AI model to perform a detailed analysis, providing a match score, a summary, and keyword comparisons. All jobs and their associated analysis results are stored locally in a user-managed SQLite database file.

---

### 2. Core Components & UI Layout

The application is a single-page interface with a clean, modern, dark-themed design.

-   **Header**: A sticky header displaying the application title ("Verity App") and buttons for importing and exporting the entire database.
-   **Main Content Area**: The central part of the application, containing two primary sections:
    1.  **Input Form**: For creating, selecting, and managing jobs, and for uploading resumes.
    2.  **Results Area**: Displays either the **Analysis History Table** (filtered by the selected job) or the **Detailed Analysis View** for a single result.
-   **Footer**: A simple footer at the bottom with a "Powered by Google Gemini" notice.

---

### 3. Feature Deep-Dive

#### 3.1. Job Management & Resume Upload

This is the primary interaction area for managing jobs and initiating an analysis.

##### 3.1.1. Job Selection and Creation

-   **Functionality**: A job is a persistent entity containing a title and a description. All analyses are tied to a specific job.
-   **Job Dropdown**: The primary control is a `<select>` dropdown menu listing all saved jobs. It also includes an option to **"[+] Create a New Job"**.
-   **Selection Mode**: When an existing job is selected from the dropdown, its title and description are loaded into read-only fields. The resume upload area becomes active. A trash icon appears next to the dropdown, allowing the user to delete the selected job (and all its analyses) after a confirmation prompt.
-   **Creation Mode**: When "[+] Create a New Job" is selected, the job title and description fields become editable. A "Save Job" button appears. The resume upload area is disabled, prompting the user to save the job before they can upload resumes against it.

##### 3.1.2. Resume Upload

-   **Functionality**: Allows users to upload one or more resume files to be analyzed against the *currently selected job*. This section is **disabled** when in "Creation Mode".
-   **Input Methods**: Drag and Drop, or a traditional file browser.
-   **Accepted File Formats**: `.pdf`, `.docx`, `.txt`, `.md`, `.png`, `.jpg`, `.jpeg`.
-   **UI States**:
    -   **Empty State**: A dashed-border box with an "Upload" icon and instructive text.
    -   **Files Added State**: The dropzone is replaced with a list of selected files. Each item shows an icon, the filename, and a remove ("X") button.
    -   **Add More Files**: A button allows adding more resumes to the current batch.
-   **File Processing**: The application extracts content in the background (text from documents, base64 for images), showing a loading indicator. It prevents adding files with the same filename to the same batch.

##### 3.1.3. Analysis Execution

-   **Trigger**: A prominent "Analyze Resume(s)" button.
-   **Button State**:
    -   The button is **disabled** until a job is selected AND at least one resume has been uploaded.
    -   The button text dynamically updates (e.g., "Analyze Resume" or "Analyze 3 Resumes").
-   **On Click**:
    1.  A global loading state is activated with a spinner and progress text.
    2.  The analysis is run for each uploaded resume against the selected job's description.
    3.  After completion, the input file list is cleared, and the Analysis History table is updated with the new results for that job.

#### 3.2. Analysis History Table

This table displays past analyses for the **currently selected job**.

-   **Persistence**: All results are saved in the SQLite database.
-   **Filtering**: The view is always filtered. Changing the selected job in the dropdown updates the table to show the history for that job.
-   **Empty State**: If a job is selected but has no analyses, a message prompts the user to upload resumes. If no jobs exist at all, a welcome message prompts the user to create their first job.
-   **Table Title**: The title is dynamic, e.g., "Analysis History for 'Senior Frontend Engineer'".
-   **Columns**:
    -   **Candidate**: Candidate's name and analysis date/time.
    -   **Match Score**: A color-coded donut chart (Green >= 75%, Yellow >= 50%, Red < 50%).
    -   **AI Summary**: A truncated summary.
    -   **Actions**: "Details" button and a "Delete" icon for the individual record.
-   **Error Handling**: Failed analyses appear as a row with an error message.
-   **Sorting**: Sorted by Match Score (descending), with errors at the bottom.
-   **Clear Job History**: A button in the table header allows for the deletion of all analysis results for the *current job only*, after a confirmation.

#### 3.3. Hover Preview Modal

-   **Trigger**: Hovering the mouse over the **Match Score** cell in the history table.
-   **Content**: A small, floating modal appears, showing the candidate's name and lists of **Matching Keywords** and **Missing Keywords** as colored pills.
-   **Behavior**: The modal intelligently positions itself above or below the cursor to remain in view.

#### 3.4. Detailed Analysis View

This view provides the complete, in-depth analysis for a single result.

-   **Navigation**: Accessed via the "Details" button. A "Back to Summary" button returns to the table.
-   **Content Cards**:
    -   **Overall Match Score**: Donut chart and full AI summary.
    -   **Analyzed Against**: Shows the full text of the job description used for the analysis.
    -   **Original Resume**: A collapsible section, folded by default, that displays a preview of the resume content (text or image).
    -   **Strengths** & **Areas for Improvement**: Bulleted lists.
    -   **Keyword Analysis**: Matching and missing keywords.

#### 3.5. Data Management (Import, Export)

Global data operations are available from the main header for the entire SQLite database.

-   **Export Database**: Downloads a single `resume_analyzer.db` file containing **all jobs and all analyses**, serving as a complete, portable backup.
-   **Import Database**:
    -   Allows uploading a `resume_analyzer.db` file.
    -   **Replacement Logic**: The imported database will **completely replace** the existing database in the application. This provides a simple and predictable way to restore a backup or transfer data.
    -   After import, the application reloads all data from the new database and defaults to selecting the first job in the list.

---

### 4. AI and Technical Details

-   **AI Model**: Google Gemini (`gemini-2.5-flash`).
-   **AI Interaction**: The AI is prompted to return a structured JSON object adhering to a predefined schema, which includes fields like `candidateName`, `matchScore`, `summary`, etc.
-   **Duplicate Detection**: Before calling the AI, the application computes a SHA-1 hash of the resume content and the selected job's description. It queries the local database to see if an analysis for this specific resume-job pair already exists, preventing redundant API calls.
-   **Local Storage**: Browser **SQLite database** (via `sql.js`/WASM). The database state is persisted in the browser's **IndexedDB** between sessions, providing robust, persistent storage.
-   **Frontend Stack**: React, TypeScript, Tailwind CSS.
-   **Libraries**: `sql.js` (SQLite WASM), PDF.js and Mammoth.js (file content extraction).


<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1b4li4Zji0lUbNC_q_f5WkkOWKxBOihg-

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
