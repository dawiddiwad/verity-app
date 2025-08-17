# Verity

**AI Resume Analyzer**

Verity is a powerful, locally-run web application that leverages the Google Gemini AI to analyze resumes against specific job descriptions. It provides a detailed breakdown of candidate suitability, helping users to quickly identify strengths, weaknesses, and keyword alignment. All data is stored privately in the user's browser, ensuring complete confidentiality.

---

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app (dev):
   `npm run dev`
3. Run the app (production preview)
   `npm run build` and then `npm run preview`

---

## Application Specification

### 1. High-Level Overview

**Verity** is a web application designed to help job seekers and hiring professionals evaluate how well a resume matches a specific job description, acting as an **AI Resume Analyzer**.

The core workflow is job-centric. Users first create and save distinct "Jobs," each with a title and description. They can either paste the details manually or use the AI-powered **"Load from URL"** feature to automatically extract them from a job posting. They can then select a job and analyze multiple resumes against it. The application uses the Google Gemini AI model to perform a detailed analysis, providing a match score, a summary, and keyword comparisons. All jobs and their associated analysis results are stored locally in the browser's IndexedDB, managed by a user-controlled SQLite database file.

---

### 2. Core Components & UI Layout

The application is a single-page interface with a clean, modern, and theme-able (light/dark/system) design.

-   **Database Setup Screen**: On first launch, the user is prompted to either create a fresh local database or import an existing one.
-   **Header**: A sticky header displaying the application title ("Verity") and controls for theme switching, managing the API key, and importing/exporting the entire database.
-   **Main Content Area**: The central part of the application, containing two primary sections:
    1.  **Input Form**: Features a step-by-step guide for creating/selecting jobs and uploading resumes.
    2.  **Results Area**: Displays either the **Analysis History Table** (filtered by the selected job) or the **Detailed Analysis View** for a single result.
-   **API Key Modal**: A dialog for securely entering and saving the user's Google Gemini API key.
-   **Footer**: A simple footer with a "Powered by Google Gemini" notice.

---

### 3. Feature Deep-Dive

#### 3.1. Job Management & Resume Upload

This is the primary interaction area for managing jobs and initiating an analysis, guided by a clear step-by-step indicator.

##### 3.1.1. Job Selection and Creation

-   **Job Dropdown**: A `<select>` menu lists all saved jobs and includes an option to **"[+] Create a New Job"**.
-   **Selection Mode**: When an existing job is selected, its title and description are loaded into read-only fields. A trash icon allows the user to delete the selected job and all its analyses after confirmation.
-   **Creation Mode**: When creating a new job, the user has two options:
    1.  **Load from URL**: The user can paste a URL to a job posting. Clicking the "parse" button triggers the AI to fetch the page content, extract the job title and description, and auto-populate the form fields. A loading overlay provides clear feedback during this process.
    2.  **Manual Entry**: The user can manually type or paste the job title and description into the fields.
-   **Saving**: A "Save Job" button becomes active once a title and description are present, saving the new job to the database.

##### 3.1.2. Resume Upload

-   **Functionality**: Allows users to upload one or more resume files to be analyzed against the *currently selected job*. This section is **disabled** until a job is saved and selected.
-   **Input Methods**: Drag and Drop, or a traditional file browser.
-   **Accepted File Formats**: `.pdf`, `.docx`, `.txt`, `.md`, `.png`, `.jpg`, `.jpeg`.
-   **UI**: A clean dropzone displays a list of uploaded files, each with an icon and a remove button. An "Add More Files" button is available.
-   **Processing**: A loading overlay is shown while files are being processed (content extraction, etc.), creating a consistent experience with the URL parsing loader.

##### 3.1.3. Analysis Execution

-   **Trigger**: A prominent "Analyze Resume(s)" button.
-   **Prerequisites**: The button is **disabled** until a job is selected AND at least one resume is uploaded. If the API key is not set, clicking the button will first prompt the user to enter it.
-   **On Click**: A global loading state is activated. The analysis runs for each resume, and upon completion, the input file list is cleared, and the Analysis History table updates with the new results.

#### 3.2. Analysis History Table

This table displays past analyses for the **currently selected job**.

-   **Filtering**: The view is always filtered by the job selected in the dropdown.
-   **Empty State**: If a job has no analyses, a message prompts the user to upload resumes. If no jobs exist, a welcome message appears.
-   **Columns**: Candidate name/date, a color-coded **Match Score** donut chart, a truncated AI summary, and action buttons.
-   **Error Handling**: Failed analyses are clearly marked with an error message.
-   **Sorting**: Sorted by Match Score (descending), with errors at the bottom.
-   **Clear Job History**: A button allows for the deletion of all analysis results for the current job.

#### 3.3. Hover Preview Modal

-   **Trigger**: Hovering the mouse over the **Match Score** cell in the history table.
-   **Content**: A small, floating modal appears, showing the candidate's name and lists of **Matching Keywords** and **Missing Keywords**.
-   **Behavior**: The modal intelligently positions itself to remain in view.

#### 3.4. Detailed Analysis View

This view provides the complete, in-depth analysis for a single result.

-   **Navigation**: Accessed via the "Details" button. A "Back to Summary" button returns to the table.
-   **Content Cards & Sections**:
    -   **Overall Match Score**: Donut chart and full AI summary.
    -   **Analyzed Against (Collapsible)**: Shows the full text of the job description used for the analysis.
    -   **Original Resume (Collapsible)**: A powerful, collapsible section that displays a full preview of the original resume file (rendering PDFs, images, DOCX, and plain text) and includes a download button.
    -   **Strengths** & **Gaps**: Bulleted lists.
    -   **Keyword Analysis**: Matching and missing keywords presented as colored pills.

#### 3.5. Data Management (Setup, Import, Export)

-   **Initial Setup**: The first time a user opens the app, they must either create a new, empty database or import an existing `.db` file.
-   **Export Database**: Downloads a single `.db` file containing **all jobs and all analyses**, serving as a complete, portable backup.
-   **Import Database**: Allows uploading a `.db` file, which will **completely replace** the existing database in the application.

---

### 4. AI and Technical Details

-   **AI Model**: Google Gemini (`gemini-2.5-flash`).
-   **API Key**: The app prompts the user for a Gemini API key and stores it in the browser's **session storage**. It is required for all AI-powered features.
-   **Duplicate Detection**: Before calling the AI for an analysis, the application computes a SHA-1 hash of the resume content. It checks the local database to see if an analysis for that specific resume and job already exists, preventing redundant API calls.
-   **Local Storage**: Browser **SQLite database** (via `sql.js`/WASM). The database state is persisted in the browser's **IndexedDB** between sessions, providing robust, persistent storage. All user data remains on the client-side.
-   **Frontend Stack**: React, TypeScript, Tailwind CSS.
-   **Libraries**: `sql.js` (SQLite WASM), `pdfjs-dist` (PDF text extraction/preview), `mammoth.js` (DOCX content extraction/preview).
