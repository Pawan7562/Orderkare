import React from 'react';
import { Link } from 'react-router-dom';

export const RefundPolicy = () => (
  <div className="max-w-3xl mx-auto px-4 py-16 text-slate-700 dark:text-slate-300">
    <Link to="/" className="text-orange-600 text-sm font-bold hover:underline">← Back to Home</Link>
    <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-4 mb-2">Refund Policy</h1>
    <p className="text-sm text-slate-500 mb-8">This Refund Policy applies to all services provided by OrderKare through the platform.</p>
    
    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Subscription Fees</h2>
    <p className="text-sm">Subscription fees are generally non-refundable once a plan has been activated and the restaurant account has been approved.</p>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Duplicate Payments</h2>
    <p className="text-sm">If a customer is charged more than once for the same transaction, the duplicate amount will be reviewed and refunded where applicable.</p>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Failed Transactions</h2>
    <p className="text-sm">If a payment fails but the amount is deducted, the refund process will follow the policies of the respective payment gateway and bank.</p>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Account Suspension</h2>
    <p className="text-sm">No refund will be provided if an account is suspended or terminated due to violation of our Terms & Conditions.</p>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Contact</h2>
    <p className="text-sm">For refund-related queries, please contact OrderKare through the official support channels listed on the platform.</p>

    <div className="mt-10 pt-6 border-t text-sm font-bold">
      <p>OrderKare</p>
      <p>Naubatpur, Patna, India</p>
    </div>
  </div>
);