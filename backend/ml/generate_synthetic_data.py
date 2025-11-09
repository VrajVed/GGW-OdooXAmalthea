"""
Synthetic Dataset Generator for Project Overrun Prediction Model

This script generates realistic synthetic project data based on the PostgreSQL schema
and calculates all features needed for the overrun prediction model.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')


class SyntheticProjectGenerator:
    """Generate synthetic project data with realistic patterns"""
    
    def __init__(self, n_projects: int = 300, random_seed: int = 42):
        self.n_projects = n_projects
        np.random.seed(random_seed)
        random.seed(random_seed)
        
    def generate_projects(self) -> pd.DataFrame:
        """Generate synthetic projects with all features"""
        
        print(f"Generating {self.n_projects} synthetic projects...")
        
        projects_data = []
        
        for i in range(self.n_projects):
            if (i + 1) % 50 == 0:
                print(f"  Generated {i + 1}/{self.n_projects} projects...")
            
            project = self._generate_single_project(i)
            projects_data.append(project)
        
        df = pd.DataFrame(projects_data)
        print(f"✓ Generated {len(df)} projects")
        return df
    
    def _generate_single_project(self, project_id: int) -> Dict:
        """Generate a single project with all its data"""
        
        # Determine if this is an outlier project (5% chance)
        is_outlier = np.random.random() < 0.05
        
        # Project type affects distributions (more variety!)
        project_type = np.random.choice(
            ['small', 'medium', 'large', 'enterprise', 'startup', 'government', 'nonprofit'],
            p=[0.15, 0.25, 0.20, 0.15, 0.10, 0.10, 0.05]
        )
        
        # Duration varies by project type and can have outliers
        if is_outlier:
            # Outlier: extremely short or long projects
            if np.random.random() < 0.5:
                duration_days = int(np.random.choice([7, 14, 21]))  # Very short
            else:
                duration_days = int(np.random.choice([730, 1095, 1460]))  # Very long (2-4 years)
        else:
            # Normal duration by project type
            if project_type == 'small' or project_type == 'startup':
                duration_days = int(np.random.choice([15, 30, 45, 60, 90], p=[0.1, 0.3, 0.3, 0.2, 0.1]))
            elif project_type == 'medium':
                duration_days = int(np.random.choice([60, 90, 120, 180], p=[0.2, 0.3, 0.3, 0.2]))
            elif project_type == 'large' or project_type == 'enterprise':
                duration_days = int(np.random.choice([180, 270, 365, 540], p=[0.2, 0.3, 0.3, 0.2]))
            elif project_type == 'government' or project_type == 'nonprofit':
                duration_days = int(np.random.choice([180, 365, 730], p=[0.3, 0.5, 0.2]))
            else:
                duration_days = int(np.random.choice([30, 60, 90, 120, 180, 270, 365], p=[0.1, 0.15, 0.2, 0.25, 0.15, 0.1, 0.05]))
        
        start_date = datetime.now() - timedelta(days=int(np.random.randint(100, 1500)))  # Wider range
        end_date = start_date + timedelta(days=duration_days)
        
        # Actual end date varies more (some projects are way off schedule)
        if is_outlier:
            schedule_variance = int(np.random.choice([-60, -30, 90, 180]))  # Extreme delays/early
        else:
            schedule_variance = int(np.random.randint(-10, 30))
        actual_end_date = end_date + timedelta(days=schedule_variance)
        
        # Budget (BAC) varies by project type and can have outliers
        if is_outlier:
            # Outlier budgets: extremely small or extremely large
            if np.random.random() < 0.5:
                budget_amount = np.random.uniform(1000, 5000)  # Very small
            else:
                budget_amount = np.random.uniform(5000000, 50000000)  # Very large
        else:
            if project_type == 'small' or project_type == 'startup':
                budget_amount = np.random.lognormal(mean=8.5, sigma=0.8)  # $5k-$50k
            elif project_type == 'medium':
                budget_amount = np.random.lognormal(mean=10, sigma=1.0)  # $20k-$200k
            elif project_type == 'large':
                budget_amount = np.random.lognormal(mean=11.5, sigma=1.2)  # $100k-$1M
            elif project_type == 'enterprise':
                budget_amount = np.random.lognormal(mean=12.5, sigma=1.3)  # $250k-$5M
            elif project_type == 'government':
                budget_amount = np.random.lognormal(mean=13, sigma=1.5)  # $500k-$10M
            elif project_type == 'nonprofit':
                budget_amount = np.random.lognormal(mean=9.5, sigma=1.0)  # $10k-$100k
            else:
                budget_amount = np.random.lognormal(mean=10, sigma=1.2)
            
            budget_amount = max(1000, budget_amount)  # Minimum $1k
        
        # Generate project timeline data (pass project_type and is_outlier for variety)
        timesheets = self._generate_timesheets(start_date, actual_end_date, budget_amount, project_type, is_outlier)
        tasks = self._generate_tasks(start_date, actual_end_date, project_type, is_outlier)
        blockers = self._generate_blockers(tasks, start_date, actual_end_date, project_type, is_outlier)
        expenses = self._generate_expenses(start_date, actual_end_date, budget_amount, project_type, is_outlier)
        purchase_orders = self._generate_purchase_orders(start_date, actual_end_date, budget_amount, project_type, is_outlier)
        vendor_bills = self._generate_vendor_bills(purchase_orders, start_date, actual_end_date)
        invoices = self._generate_invoices(start_date, actual_end_date, budget_amount, project_type, is_outlier)
        user_rates = self._generate_user_rates(project_type, is_outlier)
        
        # Calculate actual cost (AC)
        ac_timesheets = timesheets['cost'].sum() if len(timesheets) > 0 and 'cost' in timesheets.columns else 0
        ac_expenses = expenses['amount'].sum() if len(expenses) > 0 and 'amount' in expenses.columns else 0
        ac_vendor_bills = vendor_bills['grand_total'].sum() if len(vendor_bills) > 0 and 'grand_total' in vendor_bills.columns else 0
        base_actual_cost = ac_timesheets + ac_expenses + ac_vendor_bills
        
        # Add realistic noise to actual cost (5-15% variation to simulate measurement errors, 
        # unrecorded costs, estimation inaccuracies)
        noise_factor = np.random.uniform(0.95, 1.15)
        actual_cost = base_actual_cost * noise_factor
        
        # Calculate progress percentage (realistic, may not match actual completion)
        progress_pct = min(100, np.random.beta(2, 1) * 100) if actual_end_date <= datetime.now() else min(100, np.random.beta(1.5, 2) * 100)
        
        # Calculate features
        features = self._calculate_features(
            start_date=start_date,
            end_date=end_date,
            actual_end_date=actual_end_date,
            budget_amount=budget_amount,
            actual_cost=actual_cost,
            progress_pct=progress_pct,
            timesheets=timesheets,
            tasks=tasks,
            blockers=blockers,
            expenses=expenses,
            purchase_orders=purchase_orders,
            vendor_bills=vendor_bills,
            invoices=invoices,
            user_rates=user_rates
        )
        
        # Label: 1 if AC > BAC, else 0
        # Add some realistic uncertainty - not all overruns are perfectly predictable
        # Projects close to budget line have some randomness
        cost_ratio = actual_cost / budget_amount if budget_amount > 0 else 1.0
        
        # Deterministic overrun (clearly over budget)
        if cost_ratio > 1.1:
            label = 1
        # Deterministic no overrun (clearly under budget)
        elif cost_ratio < 0.9:
            label = 0
        # Gray zone (0.9-1.1): Add randomness to make it more realistic
        # Projects in this range have 70% chance of following the cost_ratio
        else:
            if cost_ratio > 1.0:
                # Slightly over budget - 75% chance of overrun
                label = 1 if np.random.random() < 0.75 else 0
            else:
                # Slightly under budget - 25% chance of overrun (scope creep, hidden costs)
                label = 1 if np.random.random() < 0.25 else 0
        
        return {
            'project_id': project_id,
            'label': label,
            'budget_amount': budget_amount,
            'actual_cost': actual_cost,
            'start_date': start_date,
            'end_date': end_date,
            'actual_end_date': actual_end_date,
            'progress_pct': progress_pct,
            **features
        }
    
    def _generate_timesheets(self, start_date: datetime, end_date: datetime, budget_amount: float, 
                           project_type: str, is_outlier: bool) -> pd.DataFrame:
        """Generate realistic timesheet entries with variety"""
        
        timesheets = []
        current_date = start_date
        
        # Vary patterns by project type
        if project_type == 'startup':
            weekend_work_prob = 0.6  # Startups work weekends
            avg_people = 1.5
            avg_hours = 8
            rate_range = (40, 120)  # Lower rates
        elif project_type == 'enterprise' or project_type == 'government':
            weekend_work_prob = 0.1  # Less weekend work
            avg_people = 4.0
            avg_hours = 7
            rate_range = (100, 300)  # Higher rates
        elif project_type == 'nonprofit':
            weekend_work_prob = 0.4
            avg_people = 2.0
            avg_hours = 6
            rate_range = (30, 100)  # Lower rates
        else:
            weekend_work_prob = 0.3
            avg_people = 2.5
            avg_hours = 6
            rate_range = (50, 200)
        
        # Outliers: extreme patterns
        if is_outlier:
            if np.random.random() < 0.5:
                # Outlier: very sparse timesheets (under-reporting)
                skip_prob = 0.7
                avg_people = 0.5
            else:
                # Outlier: very dense timesheets (over-reporting)
                skip_prob = 0.0
                avg_people = 8.0
                avg_hours = 12
        else:
            skip_prob = 0.0
        
        # Generate daily timesheet entries
        while current_date <= end_date:
            # Skip weekends based on project type
            is_weekend = current_date.weekday() >= 5
            if is_weekend:
                work_today = np.random.random() < weekend_work_prob
            else:
                work_today = True
            
            # Outlier: skip many days
            if np.random.random() < skip_prob:
                work_today = False
            
            if work_today:
                # Number of people working (varies by type)
                n_people = int(np.random.poisson(avg_people))
                if is_outlier and avg_people > 5:
                    n_people = max(1, n_people)  # At least 1 for outlier
                else:
                    n_people = max(1, min(10, n_people))
                
                for _ in range(n_people):
                    # Hours worked (varies by type)
                    if is_outlier and avg_hours > 8:
                        hours = np.random.normal(avg_hours, 2)
                        hours = max(8, min(16, hours))  # Extreme hours
                    else:
                        hours = np.random.normal(avg_hours, 1.5)
                        hours = max(2, min(10, hours))
                    
                    # Cost rate (varies by type)
                    cost_rate = np.random.uniform(rate_range[0], rate_range[1])
                    if is_outlier and np.random.random() < 0.1:
                        cost_rate *= np.random.uniform(2, 4)  # Extreme rates sometimes
                    
                    timesheets.append({
                        'worked_on': current_date,
                        'hours': hours,
                        'cost_rate': cost_rate,
                        'cost': hours * cost_rate
                    })
            
            current_date += timedelta(days=1)
        
        return pd.DataFrame(timesheets)
    
    def _generate_tasks(self, start_date: datetime, end_date: datetime, 
                       project_type: str, is_outlier: bool) -> pd.DataFrame:
        """Generate tasks with creation dates (for scope creep calculation)"""
        
        # Task count varies by project type
        if project_type == 'small' or project_type == 'startup':
            avg_tasks = 10
            max_tasks = 30
        elif project_type == 'medium':
            avg_tasks = 25
            max_tasks = 75
        elif project_type == 'large' or project_type == 'enterprise':
            avg_tasks = 50
            max_tasks = 200
        elif project_type == 'government':
            avg_tasks = 75
            max_tasks = 300
        else:
            avg_tasks = 25
            max_tasks = 100
        
        # Outliers: extreme task counts
        if is_outlier:
            if np.random.random() < 0.5:
                n_tasks = np.random.randint(1, 5)  # Very few tasks
            else:
                n_tasks = np.random.randint(500, 1000)  # Massive task lists
        else:
            n_tasks = int(np.random.poisson(avg_tasks))
            n_tasks = max(3, min(max_tasks, n_tasks))
        
        tasks = []
        for i in range(n_tasks):
            # Task creation date (some before start, most after)
            if np.random.random() < 0.2:
                created_at = start_date - timedelta(days=int(np.random.randint(1, 30)))
            else:
                # Scope creep: tasks added after start
                duration_days = max(1, (end_date - start_date).days)
                days_after_start = int(np.random.randint(0, duration_days))
                created_at = start_date + timedelta(days=days_after_start)
            
            # Due date
            due_date = created_at + timedelta(days=int(np.random.randint(5, 60)))
            
            # State
            if created_at > end_date:
                state = 'new'
            else:
                state = np.random.choice(['new', 'in_progress', 'done', 'blocked'], 
                                        p=[0.1, 0.2, 0.6, 0.1])
            
            tasks.append({
                'created_at': created_at,
                'due_date': due_date,
                'state': state
            })
        
        return pd.DataFrame(tasks)
    
    def _generate_blockers(self, tasks: pd.DataFrame, start_date: datetime, end_date: datetime,
                          project_type: str, is_outlier: bool) -> pd.DataFrame:
        """Generate task blockers"""
        
        blockers = []
        
        # Blocker count varies by project type
        if project_type == 'startup':
            avg_blockers = 2  # Fewer blockers
        elif project_type == 'government':
            avg_blockers = 8  # More blockers
        elif project_type == 'enterprise':
            avg_blockers = 5
        else:
            avg_blockers = 3
        
        # Outliers: extreme blocker counts
        if is_outlier:
            if np.random.random() < 0.5:
                n_blockers = 0  # No blockers
            else:
                n_blockers = np.random.randint(50, 200)  # Many blockers
        else:
            n_blockers = int(np.random.poisson(avg_blockers))
            n_blockers = max(0, min(20, n_blockers))
        
        # Select random tasks to have blockers
        if len(tasks) > 0 and 'created_at' in tasks.columns:
            blocked_tasks = tasks.sample(min(n_blockers, len(tasks)))
            
            for _, task in blocked_tasks.iterrows():
                created_at = task['created_at'] + timedelta(days=int(np.random.randint(0, 30)))
                
                # 70% resolved, 30% still active
                if np.random.random() < 0.7:
                    resolved_at = created_at + timedelta(days=int(np.random.randint(1, 20)))
                else:
                    resolved_at = None
                
                blockers.append({
                    'created_at': created_at,
                    'resolved_at': resolved_at
                })
        
        return pd.DataFrame(blockers)
    
    def _generate_expenses(self, start_date: datetime, end_date: datetime, budget_amount: float,
                          project_type: str, is_outlier: bool) -> pd.DataFrame:
        """Generate project expenses"""
        
        expenses = []
        
        # Expense count varies by project type
        if project_type == 'small' or project_type == 'startup':
            avg_expenses = 2
        elif project_type == 'government':
            avg_expenses = 15  # More expenses
        elif project_type == 'enterprise':
            avg_expenses = 10
        else:
            avg_expenses = 5
        
        # Outliers: extreme expense counts
        if is_outlier:
            if np.random.random() < 0.5:
                n_expenses = 0  # No expenses
            else:
                n_expenses = np.random.randint(50, 200)  # Many expenses
        else:
            n_expenses = int(np.random.poisson(avg_expenses))
            n_expenses = max(0, min(30, n_expenses))
        
        for _ in range(n_expenses):
            duration_days = max(1, int((end_date - start_date).days))
            spent_on = start_date + timedelta(days=int(np.random.randint(0, duration_days)))
            
            # Expense amount (smaller than budget)
            amount = np.random.lognormal(mean=6, sigma=1)
            amount = min(amount, budget_amount * 0.1)  # Max 10% of budget per expense
            
            # Status
            status = np.random.choice(['submitted', 'approved', 'reimbursed', 'paid'], 
                                    p=[0.1, 0.2, 0.3, 0.4])
            
            # Only count approved/reimbursed/paid
            if status in ['approved', 'reimbursed', 'paid']:
                expenses.append({
                    'spent_on': spent_on,
                    'amount': amount,
                    'status': status
                })
        
        return pd.DataFrame(expenses)
    
    def _generate_purchase_orders(self, start_date: datetime, end_date: datetime, budget_amount: float,
                                  project_type: str, is_outlier: bool) -> pd.DataFrame:
        """Generate purchase orders"""
        
        pos = []
        
        # PO count varies by project type
        if project_type == 'small' or project_type == 'startup':
            avg_pos = 1
        elif project_type == 'government' or project_type == 'enterprise':
            avg_pos = 8  # More POs
        else:
            avg_pos = 3
        
        # Outliers: extreme PO counts
        if is_outlier:
            if np.random.random() < 0.5:
                n_pos = 0
            else:
                n_pos = np.random.randint(30, 100)
        else:
            n_pos = int(np.random.poisson(avg_pos))
            n_pos = max(0, min(20, n_pos))
        
        for _ in range(n_pos):
            half_duration = max(1, int((end_date - start_date).days // 2))
            order_date = start_date + timedelta(days=int(np.random.randint(0, half_duration)))
            
            # PO amount
            grand_total = np.random.lognormal(mean=7, sigma=1)
            grand_total = min(grand_total, budget_amount * 0.3)
            
            # Status
            status = np.random.choice(['draft', 'confirmed', 'fulfilled', 'closed'], 
                                    p=[0.1, 0.3, 0.4, 0.2])
            
            pos.append({
                'order_date': order_date,
                'grand_total': grand_total,
                'status': status
            })
        
        return pd.DataFrame(pos)
    
    def _generate_vendor_bills(self, purchase_orders: pd.DataFrame, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """Generate vendor bills linked to purchase orders"""
        
        bills = []
        
        # Only generate bills for confirmed/fulfilled POs
        if len(purchase_orders) > 0 and 'status' in purchase_orders.columns:
            valid_pos = purchase_orders[purchase_orders['status'].isin(['confirmed', 'fulfilled', 'closed'])]
        else:
            valid_pos = pd.DataFrame()
        
        # Only iterate if valid_pos has the required columns
        if len(valid_pos) > 0 and 'order_date' in valid_pos.columns and 'grand_total' in valid_pos.columns:
            for _, po in valid_pos.iterrows():
                # 80% chance of having a bill
                if np.random.random() < 0.8:
                    bill_date = po['order_date'] + timedelta(days=int(np.random.randint(5, 30)))
                    
                    # Bill amount (slightly different from PO due to adjustments)
                    grand_total = po['grand_total'] * np.random.uniform(0.95, 1.05)
                    
                    # Status
                    status = np.random.choice(['draft', 'posted', 'partially_paid', 'paid'], 
                                            p=[0.1, 0.2, 0.2, 0.5])
                    
                    # Only count posted/partially_paid/paid
                    if status in ['posted', 'partially_paid', 'paid']:
                        bills.append({
                            'bill_date': bill_date,
                            'grand_total': grand_total,
                            'status': status,
                            'purchase_order_id': po.name
                        })
        
        return pd.DataFrame(bills)
    
    def _generate_invoices(self, start_date: datetime, end_date: datetime, budget_amount: float,
                          project_type: str, is_outlier: bool) -> pd.DataFrame:
        """Generate customer invoices"""
        
        invoices = []
        
        # Invoice count varies by project type
        if project_type == 'small' or project_type == 'startup':
            avg_invoices = 2  # Fewer invoices
        elif project_type == 'government':
            avg_invoices = 10  # More invoices (milestone-based)
        elif project_type == 'enterprise':
            avg_invoices = 6
        else:
            avg_invoices = 4
        
        # Outliers: extreme invoice counts
        if is_outlier:
            if np.random.random() < 0.5:
                n_invoices = 1  # Single invoice
            else:
                n_invoices = np.random.randint(50, 200)  # Many invoices
        else:
            n_invoices = int(np.random.poisson(avg_invoices))
            n_invoices = max(1, min(25, n_invoices))
        
        for _ in range(n_invoices):
            duration_days = int((end_date - start_date).days)
            # Ensure we have at least 30 days, otherwise use a smaller range
            if duration_days > 30:
                invoice_date = start_date + timedelta(days=int(np.random.randint(30, duration_days)))
            else:
                # For short projects, use a smaller range
                invoice_date = start_date + timedelta(days=int(np.random.randint(0, max(1, duration_days))))
            
            # Invoice amount
            grand_total = np.random.lognormal(mean=8, sigma=1)
            grand_total = min(grand_total, budget_amount * 0.4)
            
            # Status
            status = np.random.choice(['draft', 'posted', 'partially_paid', 'paid'], 
                                    p=[0.1, 0.2, 0.2, 0.5])
            
            # Payment date (if paid)
            paid_at = None
            if status in ['partially_paid', 'paid']:
                paid_at = invoice_date + timedelta(days=int(np.random.randint(5, 60)))
            
            invoices.append({
                'invoice_date': invoice_date,
                'grand_total': grand_total,
                'status': status,
                'paid_at': paid_at
            })
        
        return pd.DataFrame(invoices)
    
    def _generate_user_rates(self, project_type: str, is_outlier: bool) -> pd.DataFrame:
        """Generate user rates"""
        
        # User count varies by project type
        if project_type == 'small' or project_type == 'startup':
            n_users = np.random.randint(1, 5)
            rate_range = (40, 150)  # Lower rates
        elif project_type == 'enterprise' or project_type == 'government':
            n_users = np.random.randint(10, 30)
            rate_range = (150, 400)  # Higher rates
        elif project_type == 'nonprofit':
            n_users = np.random.randint(2, 8)
            rate_range = (30, 100)  # Lower rates
        else:
            n_users = np.random.randint(5, 16)
            rate_range = (75, 250)
        
        # Outliers: extreme user counts or rates
        if is_outlier:
            if np.random.random() < 0.5:
                n_users = 1  # Single user
            else:
                n_users = np.random.randint(50, 200)  # Many users
            if np.random.random() < 0.3:
                rate_range = (500, 1000)  # Extreme rates
        
        rates = []
        for _ in range(n_users):
            bill_rate = np.random.uniform(rate_range[0], rate_range[1])
            cost_rate = bill_rate * np.random.uniform(0.4, 0.7)  # Cost is 40-70% of bill rate
            
            rates.append({
                'bill_rate': bill_rate,
                'cost_rate': cost_rate
            })
        
        return pd.DataFrame(rates)
    
    def _calculate_features(self, start_date: datetime, end_date: datetime, actual_end_date: datetime,
                           budget_amount: float, actual_cost: float, progress_pct: float,
                           timesheets: pd.DataFrame, tasks: pd.DataFrame, blockers: pd.DataFrame,
                           expenses: pd.DataFrame, purchase_orders: pd.DataFrame,
                           vendor_bills: pd.DataFrame, invoices: pd.DataFrame,
                           user_rates: pd.DataFrame) -> Dict:
        """Calculate all features for the model"""
        
        # Current date (snapshot time)
        snapshot_date = min(actual_end_date, datetime.now())
        
        # Days elapsed
        days_elapsed = (snapshot_date - start_date).days
        total_days = (end_date - start_date).days
        days_elapsed_pct = (days_elapsed / total_days * 100) if total_days > 0 else 0
        
        # Earned Value (EV) - simplified
        ev = (progress_pct / 100) * budget_amount
        
        # Planned Value (PV) - simplified
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
        if len(tasks) > 0 and 'created_at' in tasks.columns:
            tasks_after_start = tasks[tasks['created_at'] > start_date]
            scope_creep_proxy = len(tasks_after_start) / len(tasks)
        else:
            scope_creep_proxy = 0
        
        # Finance gaps (PO committed but no bill)
        if len(purchase_orders) > 0 and 'status' in purchase_orders.columns and 'grand_total' in purchase_orders.columns:
            po_committed = purchase_orders[purchase_orders['status'] == 'confirmed']['grand_total'].sum()
        else:
            po_committed = 0
        bills_linked = vendor_bills['grand_total'].sum() if len(vendor_bills) > 0 and 'grand_total' in vendor_bills.columns else 0
        finance_gaps = max(0, po_committed - bills_linked)
        
        # Invoice lag days
        if len(invoices) > 0 and 'paid_at' in invoices.columns and 'invoice_date' in invoices.columns:
            paid_invoices = invoices[invoices['paid_at'].notna()]
            if len(paid_invoices) > 0:
                invoice_lag_days = (paid_invoices['paid_at'] - paid_invoices['invoice_date']).dt.days.mean()
            else:
                invoice_lag_days = 0
        else:
            invoice_lag_days = 0
        
        # Timesheet volatility (stddev of hours/day last 14 days)
        if len(timesheets) > 0 and 'worked_on' in timesheets.columns and 'hours' in timesheets.columns:
            last_14_days = snapshot_date - timedelta(days=14)
            recent_timesheets = timesheets[timesheets['worked_on'] >= last_14_days]
            
            if len(recent_timesheets) > 0:
                daily_hours = recent_timesheets.groupby('worked_on')['hours'].sum()
                timesheet_volatility = daily_hours.std() if len(daily_hours) > 1 else 0
            else:
                timesheet_volatility = 0
        else:
            timesheet_volatility = 0
        
        # Team mix
        if len(user_rates) > 0 and 'bill_rate' in user_rates.columns:
            avg_rate = user_rates['bill_rate'].mean()
        else:
            avg_rate = 0
        
        # # people active last 7 days
        if len(timesheets) > 0 and 'worked_on' in timesheets.columns:
            last_7_days = snapshot_date - timedelta(days=7)
            recent_timesheets = timesheets[timesheets['worked_on'] >= last_7_days]
            people_active_7d = recent_timesheets['worked_on'].nunique() if len(recent_timesheets) > 0 else 0
        else:
            people_active_7d = 0
        
        # Add small realistic noise to features (simulating measurement/estimation errors)
        # This prevents perfect correlations and makes the model more realistic
        noise_std = 0.05  # 5% standard deviation for noise
        
        return {
            'cpi': max(0.1, cpi * (1 + np.random.normal(0, noise_std))),  # CPI can't be negative
            'spi': max(0.1, spi * (1 + np.random.normal(0, noise_std))),  # SPI can't be negative
            'vac_pct': vac_pct * (1 + np.random.normal(0, noise_std)),
            'burn_rate_ratio': max(0, burn_rate * (1 + np.random.normal(0, noise_std))),  # Can't be negative
            'overdue_pct': max(0, min(100, overdue_pct * (1 + np.random.normal(0, noise_std)))),  # Clamp 0-100
            'blocker_density': max(0, blocker_density * (1 + np.random.normal(0, noise_std))),  # Can't be negative
            'progress_pct': max(0, min(100, progress_pct * (1 + np.random.normal(0, noise_std)))),  # Clamp 0-100
            'days_elapsed_pct': max(0, min(100, days_elapsed_pct * (1 + np.random.normal(0, noise_std)))),  # Clamp 0-100
            'scope_creep_proxy': max(0, min(1, scope_creep_proxy * (1 + np.random.normal(0, noise_std)))),  # Clamp 0-1
            'finance_gaps': max(0, finance_gaps * (1 + np.random.normal(0, noise_std))),  # Can't be negative
            'invoice_lag_days': max(0, invoice_lag_days * (1 + np.random.normal(0, noise_std))),  # Can't be negative
            'timesheet_volatility': max(0, timesheet_volatility * (1 + np.random.normal(0, noise_std))),  # Can't be negative
            'avg_team_rate': max(0, avg_rate * (1 + np.random.normal(0, noise_std))),  # Can't be negative
            'people_active_7d': max(0, int(people_active_7d + np.random.normal(0, 0.5)))  # Round to integer, can't be negative
        }


def main():
    """Main function to generate and save synthetic data"""
    
    # Generate synthetic projects (10,000 projects for reliable training with variety)
    generator = SyntheticProjectGenerator(n_projects=10000, random_seed=42)
    df = generator.generate_projects()
    
    # Save to CSV
    output_file = 'synthetic_projects.csv'
    df.to_csv(output_file, index=False)
    print(f"\n✓ Saved synthetic dataset to {output_file}")
    print(f"  Shape: {df.shape}")
    print(f"  Label distribution:")
    print(f"    Overrun (1): {df['label'].sum()} ({df['label'].mean()*100:.1f}%)")
    print(f"    No overrun (0): {(df['label']==0).sum()} ({(1-df['label'].mean())*100:.1f}%)")
    
    # Display feature summary
    print(f"\n✓ Feature summary:")
    feature_cols = [col for col in df.columns if col not in ['project_id', 'label', 'budget_amount', 
                                                              'actual_cost', 'start_date', 'end_date', 'actual_end_date']]
    print(df[feature_cols].describe())
    
    return df


if __name__ == '__main__':
    df = main()

