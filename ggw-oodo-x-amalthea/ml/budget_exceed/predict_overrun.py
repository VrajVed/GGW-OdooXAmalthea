"""
Predict Project Overrun from Database
=====================================
This script reads project data from PostgreSQL, calculates features,
and uses the trained model to predict budget overrun.
Outputs predictions to JSON file.
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import joblib
from typing import Dict, List
import sys

# Try to import psycopg2 for database connection
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("Warning: psycopg2 not installed. Database connection disabled.")
    print("Install with: pip install psycopg2-binary")


def calculate_features_from_db(project_data: Dict, timesheets: pd.DataFrame, 
                               tasks: pd.DataFrame, blockers: pd.DataFrame,
                               expenses: pd.DataFrame, purchase_orders: pd.DataFrame,
                               vendor_bills: pd.DataFrame, invoices: pd.DataFrame,
                               user_rates: pd.DataFrame) -> Dict:
    """Calculate features from database data (same logic as training)"""
    from decimal import Decimal
    
    # Helper to convert Decimal to float
    def to_float(val):
        if val is None:
            return 0.0
        if isinstance(val, Decimal):
            return float(val)
        return float(val)
    
    start_date = project_data['start_date']
    end_date = project_data['end_date']
    budget_amount = to_float(project_data['budget_amount'])
    progress_pct = to_float(project_data['progress_pct'])
    
    # Current date (snapshot time)
    snapshot_date = min(datetime.now().date(), end_date) if end_date else datetime.now().date()
    
    # Days elapsed
    days_elapsed = (snapshot_date - start_date).days if start_date else 0
    total_days = (end_date - start_date).days if (start_date and end_date) else 1
    days_elapsed_pct = (days_elapsed / total_days * 100) if total_days > 0 else 0
    
    # Calculate actual cost (AC)
    ac_timesheets = to_float(timesheets['cost'].sum()) if len(timesheets) > 0 and 'cost' in timesheets.columns else 0.0
    ac_expenses = to_float(expenses['amount'].sum()) if len(expenses) > 0 and 'amount' in expenses.columns else 0.0
    ac_vendor_bills = to_float(vendor_bills['grand_total'].sum()) if len(vendor_bills) > 0 and 'grand_total' in vendor_bills.columns else 0.0
    actual_cost = ac_timesheets + ac_expenses + ac_vendor_bills
    
    # Earned Value (EV)
    ev = (progress_pct / 100) * budget_amount
    
    # Planned Value (PV)
    pv = (days_elapsed / total_days * budget_amount) if total_days > 0 else 0
    
    # CPI (Cost Performance Index)
    cpi = ev / actual_cost if actual_cost > 0 else 1.0
    
    # SPI (Schedule Performance Index)
    spi = ev / pv if pv > 0 else 1.0
    
    # EAC (Estimate at Completion)
    if cpi > 0:
        eac = actual_cost + (budget_amount - ev) / cpi
    else:
        eac = budget_amount
    
    # VAC% (Variance at Completion %)
    vac_pct = ((budget_amount - eac) / budget_amount * 100) if budget_amount > 0 else 0
    
    # Burn-rate ratio
    burn_rate = actual_cost / days_elapsed if days_elapsed > 0 else 0
    
    # Overdue% (tasks overdue)
    if len(tasks) > 0 and 'due_date' in tasks.columns and 'state' in tasks.columns:
        overdue_tasks = tasks[(tasks['due_date'] < snapshot_date) & (tasks['state'] != 'done')]
        overdue_pct = len(overdue_tasks) / len(tasks) * 100
    else:
        overdue_pct = 0
    
    # Blocker density
    if len(tasks) > 0 and len(blockers) > 0 and 'resolved_at' in blockers.columns:
        active_blockers = blockers[blockers['resolved_at'].isna()]
        blocker_density = len(active_blockers) / len(tasks)
    else:
        blocker_density = 0
    
    # Scope creep proxy
    if len(tasks) > 0 and 'created_at' in tasks.columns and start_date:
        tasks_after_start = tasks[pd.to_datetime(tasks['created_at']).dt.date > start_date]
        scope_creep_proxy = len(tasks_after_start) / len(tasks)
    else:
        scope_creep_proxy = 0
    
    # Finance gaps (PO committed but no bill)
    if len(purchase_orders) > 0 and 'status' in purchase_orders.columns and 'grand_total' in purchase_orders.columns:
        po_committed = to_float(purchase_orders[purchase_orders['status'] == 'confirmed']['grand_total'].sum())
    else:
        po_committed = 0.0
    bills_linked = to_float(vendor_bills['grand_total'].sum()) if len(vendor_bills) > 0 and 'grand_total' in vendor_bills.columns else 0.0
    finance_gaps = max(0, po_committed - bills_linked)
    
    # Invoice lag days
    if len(invoices) > 0 and 'paid_at' in invoices.columns and 'invoice_date' in invoices.columns:
        paid_invoices = invoices[invoices['paid_at'].notna()]
        if len(paid_invoices) > 0:
            paid_at = pd.to_datetime(paid_invoices['paid_at']).dt.tz_localize(None) if pd.to_datetime(paid_invoices['paid_at']).dt.tz is not None else pd.to_datetime(paid_invoices['paid_at'])
            invoice_date = pd.to_datetime(paid_invoices['invoice_date']).dt.tz_localize(None) if pd.to_datetime(paid_invoices['invoice_date']).dt.tz is not None else pd.to_datetime(paid_invoices['invoice_date'])
            invoice_lag_days = (paid_at - invoice_date).dt.days.mean()
        else:
            invoice_lag_days = 0
    else:
        invoice_lag_days = 0
    
    # Timesheet volatility (stddev of hours/day last 14 days)
    if len(timesheets) > 0 and 'worked_on' in timesheets.columns and 'hours' in timesheets.columns:
        last_14_days = snapshot_date - timedelta(days=14)
        recent_timesheets = timesheets[pd.to_datetime(timesheets['worked_on']).dt.date >= last_14_days]
        if len(recent_timesheets) > 0:
            daily_hours = recent_timesheets.groupby('worked_on')['hours'].sum()
            timesheet_volatility = daily_hours.std() if len(daily_hours) > 1 else 0
        else:
            timesheet_volatility = 0
    else:
        timesheet_volatility = 0
    
    # Team mix
    if len(user_rates) > 0 and 'bill_rate' in user_rates.columns:
        avg_rate = to_float(user_rates['bill_rate'].mean())
    else:
        avg_rate = 0.0
    
    # # people active last 7 days
    if len(timesheets) > 0 and 'worked_on' in timesheets.columns:
        last_7_days = snapshot_date - timedelta(days=7)
        recent_timesheets = timesheets[pd.to_datetime(timesheets['worked_on']).dt.date >= last_7_days]
        people_active_7d = recent_timesheets['worked_on'].nunique() if len(recent_timesheets) > 0 else 0
    else:
        people_active_7d = 0
    
    return {
        'cpi': cpi,
        'spi': spi,
        'vac_pct': vac_pct,
        'burn_rate_ratio': burn_rate,
        'overdue_pct': overdue_pct,
        'blocker_density': blocker_density,
        'progress_pct': progress_pct,
        'days_elapsed_pct': days_elapsed_pct,
        'scope_creep_proxy': scope_creep_proxy,
        'finance_gaps': finance_gaps,
        'invoice_lag_days': invoice_lag_days,
        'timesheet_volatility': timesheet_volatility,
        'avg_team_rate': avg_rate,
        'people_active_7d': people_active_7d
    }


def fetch_project_data_from_db(connection, project_ids: List[str] = None) -> List[Dict]:
    """Fetch project data from PostgreSQL database"""
    
    if not DB_AVAILABLE:
        raise ImportError("psycopg2 not available. Cannot connect to database.")
    
    cursor = connection.cursor(cursor_factory=RealDictCursor)
    
    # Build project filter
    project_filter = ""
    if project_ids:
        project_filter = f"AND p.id IN ({','.join([f"'{pid}'" for pid in project_ids])})"
    
    # Fetch projects
    query = f"""
        SELECT 
            p.id, p.name, p.code, p.budget_amount, p.progress_pct,
            p.start_date, p.end_date, p.baseline_start, p.baseline_end,
            p.status, p.created_at
        FROM project.projects p
        WHERE p.status IN ('in_progress', 'planned')
        {project_filter}
        ORDER BY p.created_at DESC
    """
    cursor.execute(query)
    projects = cursor.fetchall()
    
    results = []
    for project in projects:
        project_id = str(project['id'])
        
        # Fetch related data
        # Timesheets
        cursor.execute("""
            SELECT worked_on, hours, cost_rate
            FROM project.timesheets
            WHERE project_id = %s
        """, (project_id,))
        timesheets_df = cursor.fetchall()
        timesheets = pd.DataFrame(timesheets_df)
        if len(timesheets) > 0:
            timesheets['cost'] = timesheets['hours'] * timesheets['cost_rate'].fillna(0)
        else:
            timesheets = pd.DataFrame(columns=['worked_on', 'hours', 'cost_rate', 'cost'])
        
        # Tasks
        cursor.execute("""
            SELECT created_at, due_date, state
            FROM project.tasks
            WHERE project_id = %s
        """, (project_id,))
        tasks = pd.DataFrame(cursor.fetchall())
        
        # Blockers
        cursor.execute("""
            SELECT resolved_at
            FROM project.task_blockers
            WHERE task_id IN (SELECT id FROM project.tasks WHERE project_id = %s)
        """, (project_id,))
        blockers = pd.DataFrame(cursor.fetchall())
        
        # Expenses
        cursor.execute("""
            SELECT amount, status
            FROM finance.expenses
            WHERE project_id = %s AND status IN ('approved', 'reimbursed', 'paid')
        """, (project_id,))
        expenses = pd.DataFrame(cursor.fetchall())
        
        # Purchase Orders
        cursor.execute("""
            SELECT status, grand_total
            FROM finance.purchase_orders
            WHERE project_id = %s
        """, (project_id,))
        purchase_orders = pd.DataFrame(cursor.fetchall())
        
        # Vendor Bills
        cursor.execute("""
            SELECT grand_total, status
            FROM finance.vendor_bills
            WHERE project_id = %s AND status IN ('posted', 'partially_paid', 'paid')
        """, (project_id,))
        vendor_bills = pd.DataFrame(cursor.fetchall())
        
        # Invoices
        cursor.execute("""
            SELECT invoice_date, paid_at
            FROM finance.customer_invoices
            WHERE project_id = %s AND paid_at IS NOT NULL
        """, (project_id,))
        invoices = pd.DataFrame(cursor.fetchall())
        
        # User Rates
        cursor.execute("""
            SELECT bill_rate
            FROM project.user_rates
            WHERE user_id IN (
                SELECT DISTINCT user_id FROM project.timesheets WHERE project_id = %s
            )
            AND valid_from <= CURRENT_DATE
            AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
        """, (project_id,))
        user_rates = pd.DataFrame(cursor.fetchall())
        
        # Calculate features
        features = calculate_features_from_db(
            project, timesheets, tasks, blockers, expenses,
            purchase_orders, vendor_bills, invoices, user_rates
        )
        
        results.append({
            'project_id': project_id,
            'project_name': project['name'],
            'project_code': project['code'],
            'budget_amount': float(project['budget_amount']),
            'features': features
        })
    
    cursor.close()
    return results


def predict_overrun(projects_data: List[Dict], model_path: str = 'project_overrun_model.pkl',
                    scaler_path: str = 'feature_scaler.pkl',
                    feature_cols_path: str = 'feature_columns.pkl') -> List[Dict]:
    """Predict overrun for projects using trained model"""
    
    # Load model and scaler
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    feature_cols = joblib.load(feature_cols_path)
    
    predictions = []
    
    for project in projects_data:
        features = project['features']
        
        # Prepare feature vector
        X = pd.DataFrame([features])
        X = X[feature_cols]
        
        # Handle missing values
        X = X.fillna(X.median())
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.median())
        
        # Scale features
        X_scaled = scaler.transform(X)
        
        # Predict
        prediction = model.predict(X_scaled)[0]
        probability = model.predict_proba(X_scaled)[0][1]  # Probability of overrun
        
        predictions.append({
            'project_id': project['project_id'],
            'project_name': project['project_name'],
            'project_code': project['project_code'],
            'budget_amount': project['budget_amount'],
            'predicted_overrun': bool(prediction),
            'overrun_probability': float(probability),
            'features': features
        })
    
    return predictions


def main():
    """Main function"""
    
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # Database connection (optional - can also use CSV export)
    # Try to connect to database by default if psycopg2 is available
    use_database = os.getenv('USE_DATABASE', 'true').lower() == 'true' if DB_AVAILABLE else False
    
    if use_database and DB_AVAILABLE:
        # Connect to database
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'postgres'),
            user=os.getenv('DB_USER', 'hetanshwaghela'),
            password=os.getenv('DB_PASSWORD', '')
        )
        
        # Fetch project data
        print("Fetching project data from database...")
        projects_data = fetch_project_data_from_db(conn)
        conn.close()
        
    else:
        # Alternative: Read from CSV export
        # You can export your database to CSV and use this
        print("Database connection not available. Using CSV export method.")
        print("To use database, set USE_DATABASE=true in .env file")
        print("\nFor now, using example data from SQL file...")
        
        # For demo: create minimal example data
        projects_data = [
            {
                'project_id': '11111111-1111-1111-1111-111111111111',
                'project_name': 'Website Redesign',
                'project_code': 'PROJ-001',
                'budget_amount': 50000.0,
                'features': {
                    'cpi': 0.85, 'spi': 0.90, 'vac_pct': -15.0,
                    'burn_rate_ratio': 1200.0, 'overdue_pct': 40.0,
                    'blocker_density': 0.4, 'progress_pct': 45.5,
                    'days_elapsed_pct': 60.0, 'scope_creep_proxy': 0.4,
                    'finance_gaps': 0.0, 'invoice_lag_days': 43.0,
                    'timesheet_volatility': 1.2, 'avg_team_rate': 150.0,
                    'people_active_7d': 2
                }
            }
        ]
    
    if not projects_data:
        print("No projects found to predict.")
        return
    
    # Predict
    print(f"\nPredicting overrun for {len(projects_data)} project(s)...")
    predictions = predict_overrun(projects_data)
    
    # Output to JSON
    output_file = 'overrun_predictions.json'
    with open(output_file, 'w') as f:
        json.dump({
            'predictions': predictions,
            'generated_at': datetime.now().isoformat(),
            'total_projects': len(predictions)
        }, f, indent=2, default=str)
    
    print(f"\n✓ Predictions saved to {output_file}")
    print(f"\nResults:")
    for pred in predictions:
        status = "⚠ OVERRUN RISK" if pred['predicted_overrun'] else "✓ ON TRACK"
        print(f"  {pred['project_name']} ({pred['project_code']}): {status}")
        print(f"    Probability: {pred['overrun_probability']:.1%}")
        print(f"    Budget: ${pred['budget_amount']:,.2f}")


if __name__ == '__main__':
    main()

