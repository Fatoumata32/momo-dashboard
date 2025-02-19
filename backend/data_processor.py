import xml.etree.ElementTree as ET
import re
from datetime import datetime
import json
import sqlite3
from pathlib import Path

class MoMoDataProcessor:
    def __init__(self, db_path="sms_database.db"):
        self.db_path = db_path
        self.setup_database()

    def setup_database(self):
        """Initialize SQLite database and create tables if they don't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            date TIMESTAMP NOT NULL,
            details TEXT NOT NULL,
            raw_sms TEXT NOT NULL,
            phone_number TEXT,
            reference_id TEXT,
            balance REAL,
            fee REAL
        )
        ''')
        
        conn.commit()
        conn.close()

    def parse_amount(self, text):
        """Extract amount from text and convert to float."""
        match = re.search(r'([0-9,]+)\s*RWF', text)
        if match:
            return float(match.group(1).replace(',', ''))
        return 0

    def parse_phone_number(self, text):
        """Extract phone number from text."""
        match = re.search(r'(?:to|from|at)\s+(\+?250\d{9}|\d{10})', text)
        return match.group(1) if match else None

    def parse_reference(self, text):
        """Extract reference ID from text."""
        match = re.search(r'Ref:\s*([A-Za-z0-9]+)', text)
        return match.group(1) if match else None

    def parse_balance(self, text):
        """Extract balance from text."""
        match = re.search(r'Balance:\s*([0-9,]+)\s*RWF', text)
        return float(match.group(1).replace(',', '')) if match else None

    def parse_fee(self, text):
        """Extract transaction fee from text."""
        match = re.search(r'Fee:\s*([0-9,]+)\s*RWF', text)
        return float(match.group(1).replace(',', '')) if match else None

    def categorize_sms(self, body):
        """Categorize SMS message and extract relevant information."""
        patterns = {
            'incoming_money': r'You have received ([0-9,]+)\s*RWF from',
            'payment': r'You have paid ([0-9,]+)\s*RWF to',
            'transfer': r'You have transferred ([0-9,]+)\s*RWF to',
            'withdrawal': r'You have withdrawn ([0-9,]+)\s*RWF from',
            'airtime': r'You have bought Airtime worth ([0-9,]+)\s*RWF',
            'cashpower': r'You have bought Electricity worth ([0-9,]+)\s*RWF',
            'bank_deposit': r'You have deposited ([0-9,]+)\s*RWF',
            'bank_transfer': r'Bank transfer of ([0-9,]+)\s*RWF',
            'bundle': r'You have bought (Internet|Voice) Bundle worth ([0-9,]+)\s*RWF',
            'third_party': r'Transaction of ([0-9,]+)\s*RWF initiated by'
        }
        
        for category, pattern in patterns.items():
            match = re.search(pattern, body, re.IGNORECASE)
            if match:
                amount = self.parse_amount(body)
                phone = self.parse_phone_number(body)
                ref = self.parse_reference(body)
                balance = self.parse_balance(body)
                fee = self.parse_fee(body)
                
                return {
                    'type': category,
                    'amount': amount,
                    'details': body.strip(),
                    'raw_sms': body,
                    'phone_number': phone,
                    'reference_id': ref,
                    'balance': balance,
                    'fee': fee
                }
        
        return None

    def process_xml_file(self, file_path):
        # Parse XML file
        tree = ET.parse(file_path)
        root = tree.getroot()

        # Extract relevant data from the XML
        data = []
        for transaction in root.findall('transaction'):
            sms_data = {
                'transaction_id': transaction.find('transaction_id').text,
                'phone_number': transaction.find('phone_number').text,
                'amount': float(transaction.find('amount').text),
                'date': transaction.find('date').text,
                'details': transaction.find('details').text
            }
            data.append(sms_data)

        return data
    
    def get_transaction_summary(self):
        """Get summary statistics for dashboard."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        summary = {
            'total_transactions': 0,
            'total_amount': 0,
            'total_fees': 0,
            'by_type': {},
            'monthly_totals': {},
            'top_contacts': [],
            'hourly_distribution': {}
        }
        
        # Get total transactions and amount
        cursor.execute('SELECT COUNT(*), SUM(amount), SUM(fee) FROM transactions')
        total_count, total_amount, total_fees = cursor.fetchone()
        summary['total_transactions'] = total_count or 0
        summary['total_amount'] = total_amount or 0
        summary['total_fees'] = total_fees or 0
        
        # Get transactions by type
        cursor.execute('''
        SELECT type, COUNT(*), SUM(amount), SUM(fee)
        FROM transactions
        GROUP BY type
        ''')
        for type_, count, amount, fees in cursor.fetchall():
            summary['by_type'][type_] = {
                'count': count,
                'amount': amount,
                'fees': fees or 0
            }
        
        # Get monthly totals
        cursor.execute('''
        SELECT 
            strftime('%Y-%m', date) as month,
            COUNT(*),
            SUM(amount),
            SUM(fee)
        FROM transactions
        GROUP BY month
        ORDER BY month
        ''')
        for month, count, amount, fees in cursor.fetchall():
            summary['monthly_totals'][month] = {
                'count': count,
                'amount': amount,
                'fees': fees or 0
            }
        
        # Get top contacts
        cursor.execute('''
        SELECT 
            phone_number,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount
        FROM transactions
        WHERE phone_number IS NOT NULL
        GROUP BY phone_number
        ORDER BY transaction_count DESC
        LIMIT 5
        ''')
        summary['top_contacts'] = [
            {
                'phone': phone,
                'count': count,
                'amount': amount
            }
            for phone, count, amount in cursor.fetchall()
        ]
        
        # Get hourly distribution
        cursor.execute('''
        SELECT 
            strftime('%H', date) as hour,
            COUNT(*) as count
        FROM transactions
        GROUP BY hour
        ORDER BY hour
        ''')
        for hour, count in cursor.fetchall():
            summary['hourly_distribution'][hour] = count
        
        conn.close()
        return summary

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python data_processor.py <xml_file_path>")
        sys.exit(1)
    
    processor = MoMoDataProcessor()
    file_path = sys.argv[1]
    processed_count = processor.process_xml_file(file_path)
    
    print(f"Processed {processed_count} transactions")
    
    # Generate summary for verification
    summary = processor.get_transaction_summary()
    print("\nTransaction Summary:")
    print(f"Total Transactions: {summary['total_transactions']}")
    print(f"Total Amount: {summary['total_amount']} RWF")
    print(f"Total Fees: {summary['total_fees']} RWF")