# BigQuery Release Hub 🚀

A sleek web application built with **Python Flask** and **plain vanilla HTML, CSS, and JavaScript** that fetches the Google Cloud BigQuery Release Notes, categorizes updates, and enables you to select and draft tweets instantly.

---

## 🌟 Key Features

* **Live Feed Parsing:** Connects directly to the official [Google BigQuery Release Notes Feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml) and parses it using `BeautifulSoup`.
* **Smart Update Splitting:** Breaks down daily logs containing multiple entries (like Features, Announcements, and Issues) into isolated, readable cards.
* **Filter & Search:** Real-time frontend search and filtering by update type (Feature, Issue, Announcement, Deprecation).
* **Caching & Force Refresh:** Speeds up response times with an in-memory server cache. Features a client-side **Refresh** button with a spinner to manually pull fresh updates.
* **Smart Tweet Composer:** Select any card to generate a Twitter/X draft. Includes:
  * Automatic hashtag `#BigQuery` and link inclusion.
  * URL length validation (shortened link counts exactly as 23 characters matching Twitter's API).
  * Character warning indicator (safe, warning, danger states).
  * High-fidelity **Live Twitter UI Preview Card** highlighting links and hashtags.

---

## 🛠️ Technology Stack

* **Backend:** Python 3.12, Flask
* **HTML Parsing:** BeautifulSoup4, xml.etree.ElementTree
* **Frontend:** Plain HTML5, CSS3 Grid/Flexbox, Vanilla ES6 JavaScript (No frameworks, no Tailwind)
* **Fonts:** Outfit (headings/body), JetBrains Mono (code blocks)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Python 3.12+ installed.

### Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/<YOUR_GITHUB_USERNAME>/antigravity-event-talks-app.git
   cd antigravity-event-talks-app
   ```

2. **Set up a Virtual Environment:**
   ```bash
   # Create environment
   python -m venv venv

   # Activate environment (Windows PowerShell)
   .\venv\Scripts\Activate.ps1

   # Activate environment (Mac/Linux Bash)
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Application:**
   ```bash
   python app.py
   ```
   The application will start in development mode at **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.

---

## 📂 Project Structure

```
├── app.py                  # Flask Application Server & Atom XML Parser
├── requirements.txt        # Python Dependencies
├── .gitignore              # Files ignored by Git
├── README.md               # Repository Documentation
├── templates/
│   └── index.html          # HTML Template
└── static/
    ├── css/
    │   └── style.css       # Core styling & timeline layout
    └── js/
        └── app.js          # Client-side reactivity & sharing controller
```

---

## ⚖️ License
This project is open-source and available under the MIT License.

*Disclaimer: This dashboard is a personal helper tool and is not officially affiliated with Google Cloud or Twitter/X.*
