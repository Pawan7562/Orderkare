import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy = () => (
  <div className="max-w-3xl mx-auto px-4 py-16 text-slate-700 dark:text-slate-300">
    <Link to="/" className="text-orange-600 text-sm font-bold hover:underline">← Back to Home</Link>
    <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-4 mb-2">Privacy Policy</h1>
    <p className="text-sm text-slate-500 mb-8">This Privacy Policy explains how OrderKare collects, uses and protects user information.</p>
    
    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Information We Collect</h2>
    <ul className="list-disc pl-5 space-y-1 text-sm">
      <li>Restaurant name</li>
      <li>Owner name</li>
      <li>Email address</li>
      <li>Mobile number</li>
      <li>Business address</li>
      <li>GST Number (if provided)</li>
      <li>PAN Number (if provided)</li>
      <li>Restaurant logo and uploaded documents</li>
    </ul>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">How We Use Your Information</h2>
    <ul className="list-disc pl-5 space-y-1 text-sm">
      <li>Create and manage restaurant accounts.</li>
      <li>Verify restaurant identity.</li>
      <li>Provide QR ordering services.</li>
      <li>Improve platform performance.</li>
      <li>Respond to customer support requests.</li>
    </ul>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Data Security</h2>
    <p className="text-sm">We use secure industry practices to protect your information. However, no online platform can guarantee absolute security.</p>

    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">Third-Party Services</h2>
    <p className="text-sm">OrderKare may use trusted third-party providers including payment, hosting, analytics and cloud infrastructure services to operate the platform.</p>

    <div className="mt-10 pt-6 border-t text-sm font-bold">
      <p>OrderKare</p>
      <p>Naubatpur, Patna, India</p>
    </div>
  </div>
);