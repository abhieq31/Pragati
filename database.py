"""Database helpers for the MicroMacro pharma QA project tool."""

from __future__ import annotations

import sqlite3
from contextlib import closing
from datetime import date, timedelta
from pathlib import Path
from typing import Any

DB_PATH = Path("micromacro.db")

TASK_LEVELS = ("MICRO", "MACRO", "SUBTASK")
TASK_STATUSES = ("Not Started", "In Progress", "Blocked", "Completed")
TASK_PRIORITIES = ("Low", "Medium", "High", "Critical")
PHARMA_STAGES = (
    "Requirement Qualification",
    "Design Qualification",
    "Installation Qualification",
    "Operational Qualification",
    "Performance Qualification",
    "Validation Review",
    "CAPA Closure",
)


def get_connection() -> sqlite3.Connection:
    """Return a sqlite connection with row factory enabled."""
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection


def init_db() -> None:
    """Create tables for employees, projects, and tasks."""
    with closing(get_connection()) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                team TEXT NOT NULL,
                department TEXT NOT NULL,
                role TEXT NOT NULL,
                joined_on TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                project_size TEXT NOT NULL CHECK (project_size IN ('MICRO', 'MACRO')),
                lifecycle_type TEXT NOT NULL,
                start_date TEXT NOT NULL,
                due_date TEXT NOT NULL,
                status TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                project_id INTEGER NOT NULL,
                assignee_id INTEGER NOT NULL,
                parent_task_id INTEGER,
                team TEXT NOT NULL,
                task_level TEXT NOT NULL CHECK (task_level IN ('MICRO', 'MACRO', 'SUBTASK')),
                pharma_stage TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Blocked', 'Completed')),
                priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
                start_date TEXT NOT NULL,
                due_date TEXT NOT NULL,
                completed_date TEXT,
                estimated_hours REAL NOT NULL,
                actual_hours REAL,
                FOREIGN KEY (project_id) REFERENCES projects(id),
                FOREIGN KEY (assignee_id) REFERENCES employees(id),
                FOREIGN KEY (parent_task_id) REFERENCES tasks(id)
            );
            """
        )
        conn.commit()


def seed_data() -> None:
    """Seed starter data if the database is empty."""
    with closing(get_connection()) as conn:
        employee_count = conn.execute("SELECT COUNT(*) AS count FROM employees").fetchone()["count"]
        if employee_count > 0:
            return

        today = date.today()
        employees = [
            ("Aarti Patel", "Validation Team", "QA IT", "Validation Analyst", str(today - timedelta(days=640))),
            ("Rakesh Sharma", "Compliance Team", "QA IT", "Compliance Lead", str(today - timedelta(days=910))),
            ("Nidhi Desai", "Automation Team", "QA IT", "Test Automation Engineer", str(today - timedelta(days=450))),
            ("Amit Kulkarni", "Validation Team", "QA IT", "Senior QA Executive", str(today - timedelta(days=1200))),
            ("Pooja Mehta", "Compliance Team", "QA IT", "CAPA Coordinator", str(today - timedelta(days=520))),
        ]
        conn.executemany(
            "INSERT INTO employees (name, team, department, role, joined_on) VALUES (?, ?, ?, ?, ?)",
            employees,
        )

        projects = [
            (
                "LIMS Upgrade Validation",
                "Validation and qualification for updated laboratory information system",
                "MACRO",
                "Computer System Validation",
                str(today - timedelta(days=90)),
                str(today + timedelta(days=60)),
                "In Progress",
            ),
            (
                "Deviation Workflow Automation",
                "Automate deviation workflow and improve audit traceability",
                "MACRO",
                "QMS Digitalization",
                str(today - timedelta(days=140)),
                str(today + timedelta(days=20)),
                "In Progress",
            ),
            (
                "CAPA Closure Sprint Q2",
                "Quarterly closure sprint for open CAPAs",
                "MICRO",
                "CAPA Management",
                str(today - timedelta(days=35)),
                str(today + timedelta(days=15)),
                "In Progress",
            ),
        ]
        conn.executemany(
            """
            INSERT INTO projects (name, description, project_size, lifecycle_type, start_date, due_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            projects,
        )

        employee_ids = {row["name"]: row["id"] for row in conn.execute("SELECT id, name FROM employees")}
        project_ids = {row["name"]: row["id"] for row in conn.execute("SELECT id, name FROM projects")}

        tasks = [
            (
                "Prepare URS Traceability Matrix",
                "Map all user requirements to validation test scenarios",
                project_ids["LIMS Upgrade Validation"],
                employee_ids["Aarti Patel"],
                None,
                "Validation Team",
                "MACRO",
                "Requirement Qualification",
                "Completed",
                "High",
                str(today - timedelta(days=70)),
                str(today - timedelta(days=30)),
                str(today - timedelta(days=35)),
                28,
                30,
            ),
            (
                "Execute IQ Protocol - LIMS Server",
                "Document server installation qualification evidence",
                project_ids["LIMS Upgrade Validation"],
                employee_ids["Amit Kulkarni"],
                None,
                "Validation Team",
                "MICRO",
                "Installation Qualification",
                "In Progress",
                "Critical",
                str(today - timedelta(days=10)),
                str(today + timedelta(days=6)),
                None,
                16,
                8,
            ),
            (
                "Deviation Workflow UAT Planning",
                "Define UAT scope, scenarios and sign-off responsibilities",
                project_ids["Deviation Workflow Automation"],
                employee_ids["Nidhi Desai"],
                None,
                "Automation Team",
                "MACRO",
                "Design Qualification",
                "In Progress",
                "High",
                str(today - timedelta(days=25)),
                str(today + timedelta(days=10)),
                None,
                24,
                14,
            ),
            (
                "Build audit trail API test suite",
                "Create automated tests for role-based audit trail endpoints",
                project_ids["Deviation Workflow Automation"],
                employee_ids["Nidhi Desai"],
                None,
                "Automation Team",
                "MICRO",
                "Operational Qualification",
                "Completed",
                "Medium",
                str(today - timedelta(days=75)),
                str(today - timedelta(days=55)),
                str(today - timedelta(days=58)),
                18,
                20,
            ),
            (
                "Q2 CAPA evidence review",
                "Review CAPA artifacts before quality council meeting",
                project_ids["CAPA Closure Sprint Q2"],
                employee_ids["Pooja Mehta"],
                None,
                "Compliance Team",
                "MICRO",
                "CAPA Closure",
                "Completed",
                "High",
                str(today - timedelta(days=15)),
                str(today - timedelta(days=1)),
                str(today - timedelta(days=4)),
                12,
                13,
            ),
            (
                "Regulatory impact assessment",
                "Assess 21 CFR Part 11 and Annex 11 impact for changes",
                project_ids["Deviation Workflow Automation"],
                employee_ids["Rakesh Sharma"],
                None,
                "Compliance Team",
                "MACRO",
                "Validation Review",
                "Blocked",
                "Critical",
                str(today - timedelta(days=20)),
                str(today + timedelta(days=5)),
                None,
                20,
                7,
            ),
        ]
        conn.executemany(
            """
            INSERT INTO tasks (
                title, description, project_id, assignee_id, parent_task_id, team, task_level,
                pharma_stage, status, priority, start_date, due_date, completed_date, estimated_hours, actual_hours
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            tasks,
        )

        macro_task_id = conn.execute(
            "SELECT id FROM tasks WHERE title = 'Deviation Workflow UAT Planning'"
        ).fetchone()["id"]

        subtasks = [
            (
                "Draft UAT sign-off checklist",
                "Create checklist for UAT completion and quality approval",
                project_ids["Deviation Workflow Automation"],
                employee_ids["Rakesh Sharma"],
                macro_task_id,
                "Compliance Team",
                "SUBTASK",
                "Validation Review",
                "In Progress",
                "High",
                str(today - timedelta(days=8)),
                str(today + timedelta(days=2)),
                None,
                6,
                4,
            ),
            (
                "Map test evidence to SOP references",
                "Ensure all UAT scenarios map to SOP and regulatory controls",
                project_ids["Deviation Workflow Automation"],
                employee_ids["Aarti Patel"],
                macro_task_id,
                "Validation Team",
                "SUBTASK",
                "Validation Review",
                "Not Started",
                "Medium",
                str(today - timedelta(days=3)),
                str(today + timedelta(days=4)),
                None,
                7,
                0,
            ),
        ]
        conn.executemany(
            """
            INSERT INTO tasks (
                title, description, project_id, assignee_id, parent_task_id, team, task_level,
                pharma_stage, status, priority, start_date, due_date, completed_date, estimated_hours, actual_hours
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            subtasks,
        )
        conn.commit()


def fetch_employees() -> list[sqlite3.Row]:
    with closing(get_connection()) as conn:
        return conn.execute("SELECT * FROM employees ORDER BY name").fetchall()


def fetch_projects() -> list[sqlite3.Row]:
    with closing(get_connection()) as conn:
        return conn.execute("SELECT * FROM projects ORDER BY due_date").fetchall()


def fetch_tasks() -> list[sqlite3.Row]:
    query = """
    SELECT
        t.*,
        e.name AS assignee_name,
        p.name AS project_name,
        p.lifecycle_type,
        pt.title AS parent_task_title
    FROM tasks t
    JOIN employees e ON e.id = t.assignee_id
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN tasks pt ON pt.id = t.parent_task_id
    ORDER BY t.due_date ASC
    """
    with closing(get_connection()) as conn:
        return conn.execute(query).fetchall()


def add_employee(name: str, team: str, department: str, role: str, joined_on: str) -> None:
    with closing(get_connection()) as conn:
        conn.execute(
            "INSERT INTO employees (name, team, department, role, joined_on) VALUES (?, ?, ?, ?, ?)",
            (name.strip(), team.strip(), department.strip(), role.strip(), joined_on),
        )
        conn.commit()


def add_project(
    name: str,
    description: str,
    project_size: str,
    lifecycle_type: str,
    start_date: str,
    due_date: str,
    status: str,
) -> None:
    with closing(get_connection()) as conn:
        conn.execute(
            """
            INSERT INTO projects (name, description, project_size, lifecycle_type, start_date, due_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (name.strip(), description.strip(), project_size, lifecycle_type.strip(), start_date, due_date, status),
        )
        conn.commit()


def add_task(payload: dict[str, Any]) -> None:
    with closing(get_connection()) as conn:
        conn.execute(
            """
            INSERT INTO tasks (
                title, description, project_id, assignee_id, parent_task_id, team, task_level,
                pharma_stage, status, priority, start_date, due_date, completed_date, estimated_hours, actual_hours
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload["title"].strip(),
                payload["description"].strip(),
                payload["project_id"],
                payload["assignee_id"],
                payload.get("parent_task_id"),
                payload["team"].strip(),
                payload["task_level"],
                payload["pharma_stage"],
                payload["status"],
                payload["priority"],
                payload["start_date"],
                payload["due_date"],
                payload.get("completed_date"),
                payload["estimated_hours"],
                payload.get("actual_hours"),
            ),
        )
        conn.commit()
