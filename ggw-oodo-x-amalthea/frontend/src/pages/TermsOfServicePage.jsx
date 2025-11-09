import React from 'react'
import { Link } from 'react-router-dom'
import AuthNavbar from '../components/AuthNavbar'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <AuthNavbar variant="signup" />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using this Project Management and ERP platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              Our Service provides a comprehensive project management and enterprise resource planning (ERP) platform that includes, but is not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Project and task management with Kanban boards</li>
              <li>Time tracking and timesheet management</li>
              <li>Expense tracking and receipt management</li>
              <li>Sales order and purchase order management</li>
              <li>Customer invoice and vendor bill processing</li>
              <li>Calendar integration and scheduling</li>
              <li>Employee and user management</li>
              <li>Analytics and reporting features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Responsibilities</h2>
            <p className="text-gray-700 mb-4">
              <strong>3.1 Account Creation:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>3.2 Accurate Information:</strong> You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>3.3 Account Security:</strong> You are responsible for safeguarding your password and for any actions taken using your account. You must notify us immediately of any unauthorized use of your account.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>3.4 Role-Based Access:</strong> Your access to features and data within the Service is determined by your assigned role (e.g., Project Manager, Employee, Administrator). You agree to use only the features and access only the data appropriate to your role.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Upload, post, or transmit any content that is harmful, offensive, or violates any third-party rights</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
              <li>Share your account credentials with unauthorized parties</li>
              <li>Manipulate or falsify timesheet, expense, or financial data</li>
              <li>Use the Service to process fraudulent transactions or engage in financial misconduct</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data and Content</h2>
            <p className="text-gray-700 mb-4">
              <strong>5.1 Your Data:</strong> You retain ownership of all data, content, and information you upload or create within the Service ("Your Data"). You grant us a license to use, store, and process Your Data solely to provide and improve the Service.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>5.2 Data Accuracy:</strong> You are responsible for the accuracy, completeness, and legality of Your Data, including project information, timesheets, expenses, invoices, and financial records.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>5.3 Data Backup:</strong> While we implement reasonable backup procedures, you are responsible for maintaining your own backups of critical business data.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>5.4 Receipt and Document Storage:</strong> You may upload receipts, invoices, and other documents. You warrant that you have the right to upload such documents and that they do not contain sensitive personal information without proper authorization.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Financial Transactions and Records</h2>
            <p className="text-gray-700 mb-4">
              <strong>6.1 Accuracy:</strong> You are solely responsible for the accuracy of all financial data entered into the Service, including sales orders, purchase orders, invoices, and vendor bills.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>6.2 Compliance:</strong> You agree to use the Service in compliance with applicable accounting, tax, and financial regulations in your jurisdiction.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>6.3 Expense Reimbursement:</strong> Expense submissions must be accurate and supported by valid receipts. Fraudulent expense claims may result in immediate account termination and legal action.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>6.4 No Financial Advice:</strong> The Service provides tools for managing financial records but does not provide financial, accounting, or tax advice. Consult with qualified professionals for such advice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Service, including its original content, features, and functionality, is owned by us and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Service Availability</h2>
            <p className="text-gray-700 mb-4">
              We strive to maintain high availability of the Service but do not guarantee uninterrupted, secure, or error-free operation. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
            </p>
            <p className="text-gray-700 mb-4">
              Upon termination, your right to use the Service will cease immediately. We may delete Your Data after a reasonable retention period, subject to applicable legal requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold us harmless from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or related to your use of the Service, violation of these Terms, or infringement of any rights of another.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us through the Service or at the contact information provided in your account settings.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              to="/signup" 
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

