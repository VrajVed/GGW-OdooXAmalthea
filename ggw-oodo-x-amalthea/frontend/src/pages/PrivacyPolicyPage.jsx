import React from 'react'
import { Link } from 'react-router-dom'
import AuthNavbar from '../components/AuthNavbar'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <AuthNavbar variant="signup" />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              This Privacy Policy describes how we collect, use, store, and protect your personal information when you use our Project Management and ERP platform ("Service"). We are committed to protecting your privacy and ensuring the security of your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Account Information</h3>
            <p className="text-gray-700 mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>First name and last name</li>
              <li>Work email address</li>
              <li>Password (stored in encrypted form)</li>
              <li>Organization information</li>
              <li>Role and permissions assigned to your account</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Business Data</h3>
            <p className="text-gray-700 mb-4">
              In the course of using the Service, you may provide:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Project information, tasks, and related documents</li>
              <li>Timesheet entries and time tracking data</li>
              <li>Expense records and receipt images</li>
              <li>Sales orders, purchase orders, invoices, and vendor bills</li>
              <li>Calendar events and scheduling information</li>
              <li>Employee and customer information</li>
              <li>Financial and accounting data</li>
              <li>Notes, comments, and communications</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Usage Information</h3>
            <p className="text-gray-700 mb-4">
              We automatically collect information about how you use the Service, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Log data (IP address, browser type, access times)</li>
              <li>Feature usage and interaction patterns</li>
              <li>Device information</li>
              <li>Error logs and performance data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your transactions and manage your account</li>
              <li>Authenticate users and enforce security measures</li>
              <li>Send you service-related communications (notifications, updates, alerts)</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Generate analytics and reports for your organization</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-700 mb-4">
              <strong>4.1 Security Measures:</strong> We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Role-based access controls</li>
              <li>Regular security audits and updates</li>
              <li>Secure database connections and access controls</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>4.2 Data Location:</strong> Your data is stored on secure servers. We take reasonable steps to ensure data is stored in compliance with applicable data protection laws.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>4.3 Data Retention:</strong> We retain your data for as long as your account is active or as needed to provide the Service. You may request deletion of your data, subject to legal and contractual obligations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Within Your Organization:</strong> Data is accessible to authorized users within your organization based on their assigned roles and permissions.</li>
              <li><strong>Service Providers:</strong> We may share data with trusted third-party service providers who assist in operating the Service (e.g., cloud hosting, analytics), subject to confidentiality agreements.</li>
              <li><strong>Legal Requirements:</strong> We may disclose data if required by law, court order, or government regulation, or to protect our rights, property, or safety.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request access to your personal data stored in the Service</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information through your account settings</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data (subject to legal and business requirements)</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a machine-readable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from non-essential communications (service-related communications may still be sent)</li>
              <li><strong>Account Controls:</strong> Manage your privacy settings and data sharing preferences through your account settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Financial and Sensitive Data</h2>
            <p className="text-gray-700 mb-4">
              <strong>7.1 Financial Information:</strong> Financial data, including invoices, bills, expenses, and payment information, is stored securely and accessed only by authorized users within your organization based on their roles.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>7.2 Receipt Images:</strong> Receipt and document images you upload are stored securely and are accessible only to authorized personnel for expense processing and audit purposes.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>7.3 Employee Data:</strong> Employee information, timesheets, and related data are protected and accessible only according to your organization's access controls and applicable employment laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to maintain your session, remember your preferences, and analyze Service usage. You can control cookie preferences through your browser settings, though this may affect Service functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Third-Party Integrations</h2>
            <p className="text-gray-700 mb-4">
              The Service may integrate with third-party services (e.g., Google Calendar). When you enable such integrations, your data may be shared with those services according to their privacy policies. We encourage you to review the privacy policies of any third-party services you connect to the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your data may be transferred to and processed in countries other than your country of residence. We take appropriate safeguards to ensure your data is protected in accordance with this Privacy Policy regardless of where it is processed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We may also notify you via email or through the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through the Service or at the contact information provided in your account settings.
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

