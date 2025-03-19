# MoMoDataProcessor Project

## Overview
This project involves designing and developing a full-stack application to process SMS data in XML format. The application will clean, categorize, and store the data in a relational database while providing an interactive dashboard for data analysis and visualization.

## Objectives
- Process and clean SMS data from MTN MoMo.
- Categorize transactions based on message type.
- Store structured data in a relational database.
- Develop a frontend dashboard for data visualization and interaction.
- Optionally, create an API for backend/frontend integration.

## Features
- **Upload Files**: Upload XML files containing MoMo transaction data.
- **Transaction Categorization**: Classify transactions into types such as Incoming Money, Payments, Transfers, Airtime, etc.
- **Data Cleaning**: Handle missing or erroneous data and log unprocessed messages.
- **Database Storage**: Insert cleaned data into a relational database while ensuring integrity.
- **Search & Filter**: Filter transactions by phone number, reference ID, type, date, and amount.
- **Data Visualization**: Generate bar charts, pie charts, and summaries.
- **Pagination**: Display data efficiently with pagination.

## System Components

### 1. Data Processing (Backend)
- Uses Python libraries such as `xml.etree.ElementTree` or `lxml` for parsing XML data.
- Categorizes messages into transaction types:
  - Incoming Money
  - Payments to Code Holders
  - Transfers, Bank Deposits, Withdrawals
  - Airtime, Cash Power, Internet Bundles
- Handles data inconsistencies and logs unprocessed messages.

### 2. Database Design & Implementation
- Uses SQLite, MySQL, or PostgreSQL.
- Ensures data integrity and avoids duplication.

### 3. Frontend Dashboard
- Developed using HTML, CSS, JavaScript (with Chart.js for visualizations).
- Features:
  - Search and filter transactions.
  - Data visualization through graphs and summaries.
  - Interactive UI for detailed transaction views.
- API Integration (Optional): Uses Flask/FastAPI (Python) or Node.js.

## How to Get It Running

### Prerequisites
Before running the project, make sure you have:
- Python 3.x
- Flask installed
- SQLite (or another database of choice)
- Required dependencies installed using:
  ```bash
  pip install -r requirements.txt
  ```

### Steps to Run It
1. Clone the repo:
   ```bash
   git clone <your-github-repo-url>
   cd <project-directory>
   ```
  
2. Run the backend server:
   ```bash
   cd momo-dashboard/backend
venv\Scripts\activate  (for Windows)
   ```

3. Paste:
```bash
python -m flask run
```

4. Open `index.html` in a browser or run a local server to host the front end.
