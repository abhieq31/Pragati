"""Analytics helpers for dashboards and insight views."""

from __future__ import annotations

from datetime import datetime
from typing import Iterable

import pandas as pd


def rows_to_df(rows: Iterable[object]) -> pd.DataFrame:
    """Convert sqlite rows into a pandas DataFrame."""
    return pd.DataFrame([dict(row) for row in rows])


def build_employee_bucket_view(tasks_df: pd.DataFrame, employee_name: str) -> pd.DataFrame:
    """Return all tasks assigned to an employee with bucket labels."""
    if tasks_df.empty:
        return tasks_df

    employee_df = tasks_df.loc[tasks_df["assignee_name"] == employee_name].copy()
    if employee_df.empty:
        return employee_df

    today = pd.Timestamp(datetime.today().date())
    employee_df["due_date"] = pd.to_datetime(employee_df["due_date"])
    employee_df["deadline_bucket"] = pd.cut(
        (employee_df["due_date"] - today).dt.days,
        bins=[-9999, -1, 3, 10, 9999],
        labels=["Overdue", "Due in 3 days", "Due in 10 days", "Planned"],
    )
    return employee_df.sort_values(by=["due_date", "priority"], ascending=[True, True])


def employee_completion_summary(tasks_df: pd.DataFrame) -> pd.DataFrame:
    """Build employee-level completion metrics."""
    if tasks_df.empty:
        return pd.DataFrame()

    df = tasks_df.copy()
    df["due_date"] = pd.to_datetime(df["due_date"])
    df["completed_date"] = pd.to_datetime(df["completed_date"], errors="coerce")
    df["is_completed"] = df["status"].eq("Completed")
    df["on_time"] = df["is_completed"] & (df["completed_date"] <= df["due_date"])

    employee_project_status = (
        df.groupby(["assignee_name", "project_name"], as_index=False)
        .agg(employee_project_completed=("is_completed", "all"))
    )

    summary = (
        df.groupby(["assignee_name", "team"], as_index=False)
        .agg(
            total_tasks=("id", "count"),
            completed_tasks=("is_completed", "sum"),
            completed_on_time=("on_time", "sum"),
            projects_contributed=("project_name", "nunique"),
            macro_tasks=("task_level", lambda s: (s == "MACRO").sum()),
            micro_tasks=("task_level", lambda s: (s == "MICRO").sum()),
            subtasks=("task_level", lambda s: (s == "SUBTASK").sum()),
        )
        .sort_values(by=["completed_tasks", "completed_on_time"], ascending=False)
    )
    completed_projects = (
        employee_project_status.groupby("assignee_name", as_index=False)
        .agg(projects_completed=("employee_project_completed", "sum"))
    )
    summary = summary.merge(completed_projects, on="assignee_name", how="left")
    summary["projects_completed"] = summary["projects_completed"].fillna(0).astype(int)
    summary["completion_rate_pct"] = (summary["completed_tasks"] / summary["total_tasks"] * 100).round(1)
    summary["on_time_rate_pct"] = (
        summary["completed_on_time"] / summary["completed_tasks"].replace(0, pd.NA) * 100
    ).round(1)
    summary["project_completion_rate_pct"] = (
        summary["projects_completed"] / summary["projects_contributed"].replace(0, pd.NA) * 100
    ).round(1)
    summary["project_completion_rate_pct"] = summary["project_completion_rate_pct"].fillna(0)
    summary["on_time_rate_pct"] = summary["on_time_rate_pct"].fillna(0)
    return summary


def team_progress_summary(tasks_df: pd.DataFrame) -> pd.DataFrame:
    """Build team-level progress and micro task focus."""
    if tasks_df.empty:
        return pd.DataFrame()

    df = tasks_df.copy()
    df["is_completed"] = df["status"].eq("Completed")
    df["is_micro"] = df["task_level"].eq("MICRO")
    df["micro_open"] = df["is_micro"] & (~df["is_completed"])

    team_df = (
        df.groupby("team", as_index=False)
        .agg(
            total_tasks=("id", "count"),
            completed_tasks=("is_completed", "sum"),
            in_progress=("status", lambda s: (s == "In Progress").sum()),
            blocked=("status", lambda s: (s == "Blocked").sum()),
            micro_open_tasks=("micro_open", "sum"),
        )
        .sort_values(by="micro_open_tasks", ascending=False)
    )
    team_df["completion_rate_pct"] = (team_df["completed_tasks"] / team_df["total_tasks"] * 100).round(1)
    return team_df


def subtask_hierarchy_view(tasks_df: pd.DataFrame) -> pd.DataFrame:
    """Return outstanding subtasks with parent context."""
    if tasks_df.empty:
        return pd.DataFrame()
    subtasks = tasks_df.loc[tasks_df["task_level"] == "SUBTASK"].copy()
    if subtasks.empty:
        return subtasks

    subtasks["due_date"] = pd.to_datetime(subtasks["due_date"])
    subtasks = subtasks.sort_values(by=["status", "due_date", "priority"], ascending=[True, True, True])
    return subtasks[
        [
            "title",
            "parent_task_title",
            "project_name",
            "assignee_name",
            "team",
            "status",
            "priority",
            "due_date",
        ]
    ]


def annual_employee_achievement(tasks_df: pd.DataFrame, year: int) -> pd.DataFrame:
    """Return annual effort dashboard with early completion signal."""
    if tasks_df.empty:
        return pd.DataFrame()

    df = tasks_df.copy()
    df["completed_date"] = pd.to_datetime(df["completed_date"], errors="coerce")
    df["due_date"] = pd.to_datetime(df["due_date"], errors="coerce")
    annual = df.loc[df["completed_date"].dt.year == year].copy()
    if annual.empty:
        return pd.DataFrame()

    annual["finished_early"] = annual["completed_date"] < annual["due_date"]
    annual["is_big_task"] = annual["task_level"] == "MACRO"
    annual["is_micro"] = annual["task_level"] == "MICRO"
    annual["micro_finished_early"] = annual["is_micro"] & annual["finished_early"]

    leaderboard = (
        annual.groupby(["assignee_name", "team"], as_index=False)
        .agg(
            big_tasks_completed=("is_big_task", "sum"),
            micro_tasks_completed=("is_micro", "sum"),
            early_completions=("finished_early", "sum"),
            early_micro_completions=("micro_finished_early", "sum"),
            total_completed=("id", "count"),
        )
        .sort_values(by=["early_micro_completions", "early_completions"], ascending=False)
    )
    return leaderboard


def project_progress_summary(tasks_df: pd.DataFrame) -> pd.DataFrame:
    """Top-level project progress using task completion percentages."""
    if tasks_df.empty:
        return pd.DataFrame()

    df = tasks_df.copy()
    df["is_completed"] = df["status"].eq("Completed")
    df["is_blocked"] = df["status"].eq("Blocked")

    project_df = (
        df.groupby(["project_name", "lifecycle_type"], as_index=False)
        .agg(
            total_tasks=("id", "count"),
            completed_tasks=("is_completed", "sum"),
            blocked_tasks=("is_blocked", "sum"),
            macro_tasks=("task_level", lambda s: (s == "MACRO").sum()),
            micro_tasks=("task_level", lambda s: (s == "MICRO").sum()),
            subtasks=("task_level", lambda s: (s == "SUBTASK").sum()),
        )
        .sort_values(by=["blocked_tasks", "total_tasks"], ascending=False)
    )
    project_df["completion_rate_pct"] = (project_df["completed_tasks"] / project_df["total_tasks"] * 100).round(1)
    return project_df


def lifecycle_stage_progress(tasks_df: pd.DataFrame) -> pd.DataFrame:
    """Summarize status by pharma lifecycle stage."""
    if tasks_df.empty:
        return pd.DataFrame()

    progress = (
        tasks_df.groupby(["pharma_stage", "status"], as_index=False)
        .agg(tasks=("id", "count"))
        .sort_values(by=["pharma_stage", "status"])
    )
    return progress
