import React from 'react';
import { Link } from 'react-router-dom';

export const TermsOfService = () => (
  <div className="max-w-3xl mx-auto px-4 py-16 text-slate-700 dark:text-slate-300">
    <Link to="/" className="text-orange-600 text-sm font-bold hover:underline">← Back to Home</Link>
    <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-4 mb-2">Terms & Conditions</h1>
    <p className="text-sm text-slate-500 mb-8">These Terms & Conditions govern the use of the OrderKare platform, operated by OrderKare. By creating an account or using our services, you agree to these terms.</p>
    
    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Eligibility</h2>
    <p className="text-sm">You must provide accurate business information and operate a legally registered restaurant or food business where applicable.</p>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Account Responsibility</h2>
    <ul className="list-disc pl-5 space-y-1 text-sm">
      <li>You are responsible for maintaining your account credentials.</li>
      <li>You are responsible for all activities performed using your account.</li>
      <li>You must keep your restaurant information accurate and up to date.</li>
    </ul>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Restaurant Verification</h2>
    <p className="text-sm">OrderKare may verify restaurant information before activating an account. We reserve the right to approve, reject or suspend any account if required.</p>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Payments</h2>
    <p className="text-sm">Subscription charges, if applicable, must be paid according to the selected plan. Payment gateway charges may apply separately.</p>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Prohibited Activities</h2>
    <ul className="list-disc pl-5 space-y-1 text-sm">
      <li>Uploading false business information.</li>
      <li>Attempting unauthorized access.</li>
      <li>Using the platform for unlawful purposes.</li>
      <li>Disrupting or damaging platform services.</li>
    </ul>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Limitation of Liability</h2>
    <p className="text-sm">OrderKare provides the platform on an "as available" basis. We are not liable for indirect, incidental or consequential damages arising from the use of the service.</p>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Changes to Terms</h2>
    <p className="text-sm">We may update these Terms & Conditions from time to time. Continued use of the platform after updates constitutes acceptance.</p>

    <div className="mt-10 pt-6 border-t text-sm font-bold">
      <p>OrderKare</p>
      <p>Naubatpur, Patna, India</p>
    </div>
  </div>
);