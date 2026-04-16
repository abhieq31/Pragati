# MicroMacro - Pharma QA Project Management Tool

MicroMacro is a Streamlit + SQLite application designed for QA/IT teams in pharma environments.  
It manages both **micro** and **macro** tasks, supports sub-task hierarchy tracking, and provides views for employees, teams, and leadership.

## Why this tool

This project is tailored for quality-focused pharma software lifecycles (CSV, CAPA, validation stages).  
It helps track execution quality, completion trends, and extra effort (early completion) with practical dashboards.

## Key features (mapped to your requirements)

1. **Employee task bucket view**
   - Every employee can see all assigned work.
   - Tasks are bucketed by deadline: Overdue, Due soon, Planned.

2. **Employee-level completion view**
   - Completion rate by employee.
   - On-time completion rate.
   - Project contribution and project completion metrics.

3. **Customization for pharma quality lifecycle**
   - Built-in lifecycle stages such as RQ, DQ, IQ, OQ, PQ, Validation Review, CAPA Closure.
   - Stage-level progress charts by status.

4. **Team-wise progress with micro-task focus**
   - Team dashboards include open micro-task load, blocked counts, and completion trends.

5. **Leadership view of sub-task execution**
   - Higher-level visibility of subtasks linked to parent tasks/projects and assignees.

6. **Yearly employee achievement view**
   - Big (macro) tasks completed per employee.
   - Micro tasks completed.
   - Early completions to highlight extra effort.

## Tech stack

- **Frontend:** Streamlit
- **Storage:** SQLite
- **Analytics:** Pandas + Plotly

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

Open the local Streamlit URL shown in terminal (usually `http://localhost:8501`).

## Data model

- **employees**: team members with team/role metadata
- **projects**: micro/macro project containers
- **tasks**:
  - supports micro/macro/subtask levels
  - assignment to employee/team
  - lifecycle stage and status
  - due/completion dates and effort hours
  - optional parent task for sub-task hierarchy

The app seeds realistic pharma QA sample data on first run.

## Main screens

- Executive Dashboard
- Employee View
- Team View
- Sub-task View
- Annual Insights
- Data Entry

## Suggested next enhancements

- Role-based login (Employee / Manager / QA Head)
- Alerts for overdue and blocked critical tasks
- Excel/CSV export for audits and management review
- API + multi-user backend (PostgreSQL) for production deployment
