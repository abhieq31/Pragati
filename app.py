"""Streamlit app for pharma QA micro/macro task management."""

from __future__ import annotations

from datetime import date

import pandas as pd
import plotly.express as px
import streamlit as st

from analytics import (
    annual_employee_achievement,
    build_employee_bucket_view,
    employee_completion_summary,
    lifecycle_stage_progress,
    project_progress_summary,
    rows_to_df,
    subtask_hierarchy_view,
    team_progress_summary,
)
from database import (
    PHARMA_STAGES,
    TASK_LEVELS,
    TASK_PRIORITIES,
    TASK_STATUSES,
    add_employee,
    add_project,
    add_task,
    fetch_employees,
    fetch_projects,
    fetch_tasks,
    init_db,
    seed_data,
)


st.set_page_config(page_title="MicroMacro Pharma QA", layout="wide")
st.title("MicroMacro: Pharma QA Project Management Tool")
st.caption("Purpose-built for micro and macro task visibility across employees, teams, and leadership.")


@st.cache_data(ttl=5)
def load_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    employees_df = rows_to_df(fetch_employees())
    projects_df = rows_to_df(fetch_projects())
    tasks_df = rows_to_df(fetch_tasks())
    return employees_df, projects_df, tasks_df


def render_overview_metrics(tasks_df: pd.DataFrame) -> None:
    st.subheader("Top-level project health")
    if tasks_df.empty:
        st.info("No tasks found yet. Use the forms below to add data.")
        return

    total_tasks = len(tasks_df)
    completed = int((tasks_df["status"] == "Completed").sum())
    blocked = int((tasks_df["status"] == "Blocked").sum())
    macro_tasks = int((tasks_df["task_level"] == "MACRO").sum())
    micro_tasks = int((tasks_df["task_level"] == "MICRO").sum())

    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Total Tasks", total_tasks)
    c2.metric("Completed", completed)
    c3.metric("Blocked", blocked)
    c4.metric("Macro Tasks", macro_tasks)
    c5.metric("Micro Tasks", micro_tasks)


def render_project_health(tasks_df: pd.DataFrame) -> None:
    st.subheader("Project-level completion and risk")
    project_df = project_progress_summary(tasks_df)
    if project_df.empty:
        st.info("No project progress data available.")
        return

    st.dataframe(project_df, use_container_width=True, hide_index=True)
    fig = px.bar(
        project_df,
        x="project_name",
        y="completion_rate_pct",
        color="blocked_tasks",
        title="Project completion with blocked-task risk",
        labels={
            "project_name": "Project",
            "completion_rate_pct": "Completion %",
            "blocked_tasks": "Blocked Tasks",
        },
    )
    st.plotly_chart(fig, use_container_width=True)


def render_employee_view(employees_df: pd.DataFrame, tasks_df: pd.DataFrame) -> None:
    st.subheader("1) Employee bucket view")
    if employees_df.empty:
        st.warning("No employees available.")
        return

    employee_name = st.selectbox("Select employee", employees_df["name"].tolist(), key="employee_select")
    bucket_df = build_employee_bucket_view(tasks_df, employee_name)
    if bucket_df.empty:
        st.info("No tasks assigned to this employee.")
        return

    st.dataframe(
        bucket_df[
            [
                "title",
                "project_name",
                "task_level",
                "pharma_stage",
                "status",
                "priority",
                "due_date",
                "deadline_bucket",
            ]
        ],
        use_container_width=True,
        hide_index=True,
    )


def render_employee_completion(tasks_df: pd.DataFrame) -> None:
    st.subheader("2) Employee-level completion")
    completion_df = employee_completion_summary(tasks_df)
    if completion_df.empty:
        st.info("No completion data available.")
        return

    st.dataframe(completion_df, use_container_width=True, hide_index=True)
    fig = px.bar(
        completion_df,
        x="assignee_name",
        y="completion_rate_pct",
        color="team",
        title="Completion rate by employee",
        labels={"assignee_name": "Employee", "completion_rate_pct": "Completion %"},
    )
    st.plotly_chart(fig, use_container_width=True)


def render_pharma_lifecycle_customization(tasks_df: pd.DataFrame) -> None:
    st.subheader("3) Pharma lifecycle customization")
    progress_df = lifecycle_stage_progress(tasks_df)
    if progress_df.empty:
        st.info("No lifecycle stage data available.")
        return

    stage_filter = st.multiselect(
        "Filter lifecycle stages",
        sorted(tasks_df["pharma_stage"].dropna().unique().tolist()),
        default=sorted(tasks_df["pharma_stage"].dropna().unique().tolist()),
        key="stage_filter",
    )
    filtered = progress_df.loc[progress_df["pharma_stage"].isin(stage_filter)]
    st.dataframe(filtered, use_container_width=True, hide_index=True)

    fig = px.bar(
        filtered,
        x="pharma_stage",
        y="tasks",
        color="status",
        title="Task status by pharma lifecycle stage",
    )
    fig.update_layout(xaxis_title="Lifecycle Stage", yaxis_title="Tasks")
    st.plotly_chart(fig, use_container_width=True)


def render_team_view(tasks_df: pd.DataFrame) -> None:
    st.subheader("4) Team-wise current progress with micro-task focus")
    team_df = team_progress_summary(tasks_df)
    if team_df.empty:
        st.info("No team progress data available.")
        return

    st.dataframe(team_df, use_container_width=True, hide_index=True)
    fig = px.bar(
        team_df,
        x="team",
        y="micro_open_tasks",
        color="blocked",
        title="Open micro tasks by team",
        labels={"micro_open_tasks": "Open Micro Tasks", "blocked": "Blocked Count"},
    )
    st.plotly_chart(fig, use_container_width=True)


def render_subtask_top_view(tasks_df: pd.DataFrame) -> None:
    st.subheader("5) Leadership view of sub-task execution")
    subtasks = subtask_hierarchy_view(tasks_df)
    if subtasks.empty:
        st.info("No subtasks available.")
        return
    st.dataframe(subtasks, use_container_width=True, hide_index=True)


def render_annual_view(tasks_df: pd.DataFrame) -> None:
    st.subheader("6) Annual achievements and extra effort")
    year = st.number_input("Select year", min_value=2020, max_value=2100, value=date.today().year, step=1)
    annual_df = annual_employee_achievement(tasks_df, int(year))
    if annual_df.empty:
        st.info(f"No completed tasks found for year {int(year)}.")
        return

    st.dataframe(annual_df, use_container_width=True, hide_index=True)
    fig = px.scatter(
        annual_df,
        x="big_tasks_completed",
        y="micro_tasks_completed",
        size="early_completions",
        color="team",
        hover_name="assignee_name",
        title=f"Annual contribution map ({int(year)})",
        labels={
            "big_tasks_completed": "Big Tasks Completed",
            "micro_tasks_completed": "Micro Tasks Completed",
            "early_completions": "Early Completions",
        },
    )
    st.plotly_chart(fig, use_container_width=True)


def render_data_entry(employees_df: pd.DataFrame, projects_df: pd.DataFrame, tasks_df: pd.DataFrame) -> None:
    st.header("Data management")
    st.caption("Add employees, projects, and tasks directly from the app.")

    with st.expander("Add Employee"):
        with st.form("employee_form", clear_on_submit=True):
            name = st.text_input("Name")
            team = st.text_input("Team")
            department = st.text_input("Department", value="QA IT")
            role = st.text_input("Role")
            joined_on = st.date_input("Joined On", value=date.today())
            submitted = st.form_submit_button("Save Employee")
            if submitted:
                add_employee(name, team, department, role, str(joined_on))
                st.success("Employee added.")
                st.cache_data.clear()
                st.rerun()

    with st.expander("Add Project"):
        with st.form("project_form", clear_on_submit=True):
            name = st.text_input("Project Name")
            description = st.text_area("Description")
            project_size = st.selectbox("Project Size", ["MICRO", "MACRO"])
            lifecycle_type = st.text_input("Lifecycle Type", value="Computer System Validation")
            start_date = st.date_input("Start Date", value=date.today())
            due_date = st.date_input("Due Date", value=date.today())
            status = st.selectbox("Status", list(TASK_STATUSES))
            submitted = st.form_submit_button("Save Project")
            if submitted:
                add_project(
                    name=name,
                    description=description,
                    project_size=project_size,
                    lifecycle_type=lifecycle_type,
                    start_date=str(start_date),
                    due_date=str(due_date),
                    status=status,
                )
                st.success("Project added.")
                st.cache_data.clear()
                st.rerun()

    with st.expander("Add Task"):
        if employees_df.empty or projects_df.empty:
            st.warning("Create at least one employee and one project first.")
        else:
            employee_lookup = {f"{row['name']} ({row['team']})": int(row["id"]) for _, row in employees_df.iterrows()}
            project_lookup = {row["name"]: int(row["id"]) for _, row in projects_df.iterrows()}
            macro_lookup = {
                f"{row['title']} ({row['project_name']})": int(row["id"])
                for _, row in tasks_df.iterrows()
                if row["task_level"] in ("MACRO", "MICRO")
            }
            macro_options = ["None"] + sorted(macro_lookup.keys())

            with st.form("task_form", clear_on_submit=True):
                title = st.text_input("Task Title")
                description = st.text_area("Task Description")
                project_choice = st.selectbox("Project", sorted(project_lookup.keys()))
                assignee_choice = st.selectbox("Assignee", sorted(employee_lookup.keys()))
                task_level = st.selectbox("Task Level", list(TASK_LEVELS))
                parent_choice = st.selectbox("Parent Task (optional)", macro_options)
                team = st.text_input("Team")
                pharma_stage = st.selectbox("Pharma Stage", list(PHARMA_STAGES))
                status = st.selectbox("Task Status", list(TASK_STATUSES))
                priority = st.selectbox("Priority", list(TASK_PRIORITIES))
                start_date = st.date_input("Task Start Date", value=date.today())
                due_date = st.date_input("Task Due Date", value=date.today())
                completed_date = st.date_input("Completed Date", value=date.today(), disabled=(status != "Completed"))
                estimated_hours = st.number_input("Estimated Hours", min_value=0.5, value=8.0, step=0.5)
                actual_hours = st.number_input("Actual Hours", min_value=0.0, value=0.0, step=0.5)
                submitted = st.form_submit_button("Save Task")
                if submitted:
                    payload = {
                        "title": title,
                        "description": description,
                        "project_id": project_lookup[project_choice],
                        "assignee_id": employee_lookup[assignee_choice],
                        "parent_task_id": None if parent_choice == "None" else macro_lookup[parent_choice],
                        "team": team,
                        "task_level": task_level,
                        "pharma_stage": pharma_stage,
                        "status": status,
                        "priority": priority,
                        "start_date": str(start_date),
                        "due_date": str(due_date),
                        "completed_date": str(completed_date) if status == "Completed" else None,
                        "estimated_hours": float(estimated_hours),
                        "actual_hours": float(actual_hours),
                    }
                    add_task(payload)
                    st.success("Task added.")
                    st.cache_data.clear()
                    st.rerun()


def main() -> None:
    init_db()
    seed_data()
    employees_df, projects_df, tasks_df = load_data()

    tab_names = [
        "Executive Dashboard",
        "Employee View",
        "Team View",
        "Sub-task View",
        "Annual Insights",
        "Data Entry",
    ]
    tabs = st.tabs(tab_names)

    with tabs[0]:
        render_overview_metrics(tasks_df)
        render_project_health(tasks_df)
        render_employee_completion(tasks_df)
        render_pharma_lifecycle_customization(tasks_df)

    with tabs[1]:
        render_employee_view(employees_df, tasks_df)

    with tabs[2]:
        render_team_view(tasks_df)

    with tabs[3]:
        render_subtask_top_view(tasks_df)

    with tabs[4]:
        render_annual_view(tasks_df)

    with tabs[5]:
        render_data_entry(employees_df, projects_df, tasks_df)


if __name__ == "__main__":
    main()
