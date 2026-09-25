import React, { useState } from 'react';
import {
  CreditCard,
  Download,
  FileText,
  CheckCircle2,
  Calendar,
  Building,
  Printer,
  ChevronRight,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  ExternalLink,
  Trash2,
  Check,
  QrCode,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Layers,
  Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';

export interface InvoiceLineItem {
  id: string;
  description: string;
  sacCode: string;
  period: string;
  quantity: number;
  rateINR: number;
  amountINR: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  projectId: string;
  projectName: string;
  clientOrg: string;
  clientAddress?: string;
  clientGstin?: string;
  clientEmail?: string;
  clientPhone?: string;
  billingMonth: string;
  billingPeriodFrom: string;
  billingPeriodTo: string;
  subtotalINR: number;
  cgstRatePercent: number;
  cgstAmountINR: number;
  sgstRatePercent: number;
  sgstAmountINR: number;
  totalAmountINR: number;
  amountInWords: string;
  slaStatus: string;
  uptimeDelivered: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paymentMode?: string;
  paidAt?: string;
  dueDate: string;
  createdAt: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
}

// Convert amount in INR to readable words
const numberToIndianWords = (num: number): string => {
  const a = [
    '',
    'One ',
    'Two ',
    'Three ',
    'Four ',
    'Five ',
    'Six ',
    'Seven ',
    'Eight ',
    'Nine ',
    'Ten ',
    'Eleven ',
    'Twelve ',
    'Thirteen ',
    'Fourteen ',
    'Fifteen ',
    'Sixteen ',
    'Seventeen ',
    'Eighteen ',
    'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ' ');
    } else if (n > 0) {
      str += a[n];
    }
    return str;
  };

  if (num === 0) return 'Zero Rupees Only';

  let n = Math.floor(num);
  let crore = Math.floor(n / 10000000);
  n %= 10000000;
  let lakh = Math.floor(n / 100000);
  n %= 100000;
  let thousand = Math.floor(n / 1000);
  n %= 1000;

  let res = '';
  if (crore > 0) res += inWords(crore) + 'Crore ';
  if (lakh > 0) res += inWords(lakh) + 'Lakh ';
  if (thousand > 0) res += inWords(thousand) + 'Thousand ';
  if (n > 0) res += inWords(n);

  return 'INR ' + res.trim() + ' Only';
};

export const InvoicingFinOpsPage: React.FC = () => {
  const { projects } = useProjects();
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Invoice Form State
  const [newClientProjectId, setNewClientProjectId] = useState(projects[0]?.id || '');
  const [newBillingMonth, setNewBillingMonth] = useState('October 2026');
  const [newDueDate, setNewDueDate] = useState('2026-10-10');
  const [newAmountINR, setNewAmountINR] = useState<number>(45000);
  const [newNotes, setNewNotes] = useState('Dedicated Cloud SRE retainer, CI/CD pipelines & 99.9% Uptime Guarantee');

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([
    {
      id: 'inv_01',
      invoiceNo: 'NXF-2026-0901',
      projectId: 'proj_pkthenexgenexam',
      projectName: 'PK The NexGen Exam Monitoring System',
      clientOrg: 'PK The NexGen Education & Exam Labs',
      clientAddress: 'Tech City Campus, Sector 62, Noida, Uttar Pradesh 201309',
      clientGstin: '09AAACP4412K1Z9',
      clientEmail: 'admin@pkthenexgenexam.xyz',
      clientPhone: '+91 98765 43210',
      billingMonth: 'September 2026',
      billingPeriodFrom: '2026-09-01',
      billingPeriodTo: '2026-09-30',
      subtotalINR: 55085,
      cgstRatePercent: 9,
      cgstAmountINR: 4957.65,
      sgstRatePercent: 9,
      sgstAmountINR: 4957.65,
      totalAmountINR: 65000,
      amountInWords: 'INR Sixty-Five Thousand Only',
      slaStatus: 'MET (99.98% SLA Availability Delivered)',
      uptimeDelivered: 99.98,
      status: 'PAID',
      paymentMode: 'Razorpay Corporate UPI / IMPS',
      paidAt: '2026-09-03',
      dueDate: '2026-09-05',
      createdAt: '2026-09-01',
      lineItems: [
        {
          id: 'li_1',
          description: 'Enterprise AI Proctoring Cloud Infrastructure & Dedicated SRE Lead',
          sacCode: '998314',
          period: 'September 2026',
          quantity: 1,
          rateINR: 40000,
          amountINR: 40000,
        },
        {
          id: 'li_2',
          description: 'Low-latency WebRTC Video Frame Relay & Anti-Cheat Fast Inference Nodes',
          sacCode: '998314',
          period: 'September 2026',
          quantity: 1,
          rateINR: 15085,
          amountINR: 15085,
        },
      ],
      notes: 'Monthly retainer for PK The NexGen Exam Monitoring System with 24/7 incident response.',
    },
    {
      id: 'inv_02',
      invoiceNo: 'NXF-2026-0902',
      projectId: 'proj_orderkare',
      projectName: 'OrderKare Dining & QR SaaS',
      clientOrg: 'OrderKare Technologies Pvt Ltd',
      clientAddress: 'Plot 45, Cyber Gateway, Hitec City, Hyderabad, Telangana 500081',
      clientGstin: '36AAACP9811F1Z2',
      clientEmail: 'admin@orderkare.com',
      clientPhone: '+91 98765 11223',
      billingMonth: 'September 2026',
      billingPeriodFrom: '2026-09-01',
      billingPeriodTo: '2026-09-30',
      subtotalINR: 38136,
      cgstRatePercent: 9,
      cgstAmountINR: 3432,
      sgstRatePercent: 9,
      sgstAmountINR: 3432,
      totalAmountINR: 45000,
      amountInWords: 'INR Forty-Five Thousand Only',
      slaStatus: 'MET (99.99% SLA Availability Delivered)',
      uptimeDelivered: 99.99,
      status: 'PAID',
      paymentMode: 'Net Banking HDFC RTGS',
      paidAt: '2026-09-04',
      dueDate: '2026-09-05',
      createdAt: '2026-09-01',
      lineItems: [
        {
          id: 'li_3',
          description: 'Multi-Tenant Restaurant Fleet DevOps, PostgreSQL Auto-failover & Edge CDN',
          sacCode: '998314',
          period: 'September 2026',
          quantity: 1,
          rateINR: 38136,
          amountINR: 38136,
        },
      ],
      notes: 'High-availability restaurant dining QR order engine infrastructure & payment webhook workers.',
    },
    {
      id: 'inv_03',
      invoiceNo: 'NXF-2026-0903',
      projectId: 'proj_swiftdrop',
      projectName: 'SwiftDrop Courier & Hyperlocal Logistics',
      clientOrg: 'SwiftDrop Express Logistics India',
      clientAddress: 'Building 12, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
      clientGstin: '29AAACS5512B1Z7',
      clientEmail: 'billing@swiftdrop.in',
      clientPhone: '+91 98765 88990',
      billingMonth: 'September 2026',
      billingPeriodFrom: '2026-09-01',
      billingPeriodTo: '2026-09-30',
      subtotalINR: 72034,
      cgstRatePercent: 9,
      cgstAmountINR: 6483,
      sgstRatePercent: 9,
      sgstAmountINR: 6483,
      totalAmountINR: 85000,
      amountInWords: 'INR Eighty-Five Thousand Only',
      slaStatus: 'MET (99.95% SLA Availability Delivered)',
      uptimeDelivered: 99.95,
      status: 'PENDING',
      dueDate: '2026-09-25',
      createdAt: '2026-09-01',
      lineItems: [
        {
          id: 'li_4',
          description: 'Geohash Geolocation Real-time Tracking Fleet & Redis Pub/Sub Cluster',
          sacCode: '998314',
          period: 'September 2026',
          quantity: 1,
          rateINR: 72034,
          amountINR: 72034,
        },
      ],
      notes: 'High-volume rider dispatch infrastructure and WebSocket real-time fleet synchronization.',
    },
    {
      id: 'inv_04',
      invoiceNo: 'NXF-2026-0904',
      projectId: 'proj_nexus_crm',
      projectName: 'Nexus Enterprise Multi-Tenant CRM',
      clientOrg: 'Nexus Global Solutions Inc',
      clientAddress: 'Infinity Tower C, DLF CyberCity, Gurugram, Haryana 122002',
      clientGstin: '06AAACN7721D1Z1',
      clientEmail: 'accounts@nexusglobal.com',
      clientPhone: '+91 98765 33445',
      billingMonth: 'September 2026',
      billingPeriodFrom: '2026-09-01',
      billingPeriodTo: '2026-09-30',
      subtotalINR: 55085,
      cgstRatePercent: 9,
      cgstAmountINR: 4957.65,
      sgstRatePercent: 9,
      sgstAmountINR: 4957.65,
      totalAmountINR: 65000,
      amountInWords: 'INR Sixty-Five Thousand Only',
      slaStatus: 'MET (99.92% SLA Availability Delivered)',
      uptimeDelivered: 99.92,
      status: 'OVERDUE',
      dueDate: '2026-09-15',
      createdAt: '2026-09-01',
      lineItems: [
        {
          id: 'li_5',
          description: 'Multi-Tenant Database Row-Level Security, Elastic Search & Daily Snapshots',
          sacCode: '998314',
          period: 'September 2026',
          quantity: 1,
          rateINR: 55085,
          amountINR: 55085,
        },
      ],
      notes: 'Enterprise CRM customer database partitioning and automated CI/CD staging test pipelines.',
    },
  ]);

  // Dynamic Financial Calculations
  const totalMonthlyMRR = invoices.reduce((acc, inv) => acc + inv.totalAmountINR, 0);
  const totalCollectedINR = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((acc, inv) => acc + inv.totalAmountINR, 0);
  const totalPendingINR = invoices
    .filter((inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE')
    .reduce((acc, inv) => acc + inv.totalAmountINR, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === newClientProjectId) || projects[0];
    if (!proj) return;

    const total = Number(newAmountINR) || 45000;
    const subtotal = Math.round(total / 1.18);
    const gstTotal = total - subtotal;
    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;

    const newInv: InvoiceRecord = {
      id: `inv_${Date.now()}`,
      invoiceNo: `NXF-2026-${String(invoices.length + 1).padStart(4, '0')}`,
      projectId: proj.id,
      projectName: proj.name,
      clientOrg: proj.clientOrgName,
      clientAddress: 'Registered Corporate Client Office, India',
      clientGstin: '07AAACP9988Z1Z5',
      clientEmail: proj.primaryContact.email,
      clientPhone: proj.primaryContact.phone,
      billingMonth: newBillingMonth,
      billingPeriodFrom: '2026-10-01',
      billingPeriodTo: '2026-10-31',
      subtotalINR: subtotal,
      cgstRatePercent: 9,
      cgstAmountINR: cgst,
      sgstRatePercent: 9,
      sgstAmountINR: sgst,
      totalAmountINR: total,
      amountInWords: numberToIndianWords(total),
      slaStatus: `MET (${proj.uptimePercent}% SLA Delivered)`,
      uptimeDelivered: proj.uptimePercent,
      status: 'PENDING',
      dueDate: newDueDate,
      createdAt: new Date().toISOString().slice(0, 10),
      lineItems: [
        {
          id: `li_${Date.now()}`,
          description: `Dedicated Cloud DevOps, CI/CD Engine & SRE Maintenance (${proj.framework})`,
          sacCode: '998314',
          period: newBillingMonth,
          quantity: 1,
          rateINR: subtotal,
          amountINR: subtotal,
        },
      ],
      notes: newNotes,
    };

    setInvoices([newInv, ...invoices]);
    setShowCreateModal(false);
    setSelectedInvoice(newInv);
  };

  const handleToggleStatus = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const nextStatus: 'PAID' | 'PENDING' = inv.status === 'PAID' ? 'PENDING' : 'PAID';
          return {
            ...inv,
            status: nextStatus,
            paidAt: nextStatus === 'PAID' ? new Date().toISOString().slice(0, 10) : undefined,
            paymentMode: nextStatus === 'PAID' ? 'Razorpay Corporate IMPS / UPI' : undefined,
          };
        }
        return inv;
      })
    );
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice record?')) {
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(null);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Tax Date', 'Client Org', 'Project Name', 'Billing Month', 'Subtotal (INR)', 'GST 18%', 'Total (INR)', 'Status', 'Due Date'];
    const rows = invoices.map((inv) => [
      inv.invoiceNo,
      inv.createdAt,
      `"${inv.clientOrg}"`,
      `"${inv.projectName}"`,
      inv.billingMonth,
      inv.subtotalINR,
      inv.cgstAmountINR + inv.sgstAmountINR,
      inv.totalAmountINR,
      inv.status,
      inv.dueDate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexify_invoices_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientOrg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header Ribbon (Screen Only) ── */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Client Retainer & SLA Tax Invoicing
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              GST Tax Invoicing Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Automated monthly cloud maintenance billing, 18% GST tax statements, and verified SLA uptime guarantee certificates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 theme-btn-primary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* ── Financial KPI Metrics (Screen Only) ── */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Total Invoiced (MRR)</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              ₹{totalMonthlyMRR.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{invoices.length} Fleet Contracts</span>
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Collected & Realized</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-emerald-700 font-mono">
              ₹{totalCollectedINR.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-emerald-600 font-medium">100% Verified Bank Clearance</p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Pending / Receivables</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-amber-700 font-mono">
              ₹{totalPendingINR.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">Due within Net 15 days</p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Uptime SLA Guarantee</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xl font-bold text-emerald-700 font-mono">99.98%</span>
          </div>
          <p className="text-[10px] text-emerald-700 font-medium font-mono">0 SLA Rebates Required</p>
        </div>
      </div>

      {/* ── Search & Filter Controls (Screen Only) ── */}
      <div className="no-print enterprise-card rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, client org, project..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ── Invoices Ledger Table (Screen Only) ── */}
      <div className="no-print enterprise-card rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Monthly Client Invoices Ledger</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {inv.invoiceNo}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    {inv.billingMonth}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : inv.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {inv.status}
                  </span>
                  {inv.paidAt && (
                    <span className="text-[10px] font-mono text-emerald-700">
                      Paid on: {inv.paidAt} ({inv.paymentMode})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{inv.projectName}</h4>
                  <span className="text-slate-400">•</span>
                  <p className="text-xs text-slate-600 font-semibold">{inv.clientOrg}</p>
                </div>

                <p className="text-[11px] text-slate-500 font-mono">
                  SLA Delivered: <strong className="text-emerald-700">{inv.uptimeDelivered}%</strong> • Due Date: {inv.dueDate}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-6 text-xs font-mono pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-left lg:text-right">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Tax Inclusive Total</span>
                  <span className="text-slate-900 font-bold text-base">₹{inv.totalAmountINR.toLocaleString('en-IN')}</span>
                  <p className="text-[9px] text-slate-400">
                    (Base: ₹{inv.subtotalINR.toLocaleString('en-IN')} + 18% GST)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(inv.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all border cursor-pointer ${
                      inv.status === 'PAID'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-xs'
                    }`}
                    title="Toggle Paid / Pending"
                  >
                    {inv.status === 'PAID' ? 'Mark Pending' : '✓ Mark Paid'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View & Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteInvoice(inv.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                    title="Delete Invoice Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredInvoices.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              No invoice statements match the selected filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* ── Create New Tax Invoice Modal (Screen Only) ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg z-10 space-y-4 text-xs shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Generate Client Tax Invoice</h3>
                    <p className="text-[11px] text-slate-500">Create official GST billing invoice for a client fleet</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-7 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-3.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Client Fleet Project *</label>
                  <select
                    value={newClientProjectId}
                    onChange={(e) => {
                      setNewClientProjectId(e.target.value);
                      const p = projects.find((x) => x.id === e.target.value);
                      if (p && p.monthlyFeeINR) {
                        setNewAmountINR(p.monthlyFeeINR);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 font-medium"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.clientOrgName}) — ₹{(p.monthlyFeeINR || 0).toLocaleString('en-IN')}/mo
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Billing Month *</label>
                    <input
                      type="text"
                      required
                      value={newBillingMonth}
                      onChange={(e) => setNewBillingMonth(e.target.value)}
                      placeholder="e.g. October 2026"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Total Amount (INR, GST Inclusive) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newAmountINR}
                    onChange={(e) => setNewAmountINR(Number(e.target.value))}
                    placeholder="45000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Auto-splits into Base Taxable ({Math.round(newAmountINR / 1.18)}) + 18% GST ({Math.round(newAmountINR - newAmountINR / 1.18)})
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Service Notes / Deliverables</label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 theme-btn-primary rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Generate & View Invoice</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Full Enterprise Tax Invoice Modal & Print View ── */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white border border-slate-200 rounded-3xl w-full max-w-4xl z-10 text-xs shadow-2xl my-6 overflow-hidden printable-invoice-sheet"
            >
              {/* Top Modal Controls (Hidden in Print) */}
              <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold">
                    Official Tax Statement: <span className="text-emerald-400">{selectedInvoice.invoiceNo}</span>
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      selectedInvoice.status === 'PAID'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF (A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* ── THE PRINTABLE INVOICE SHEET (A4 Perfect Format) ── */}
              <div className="p-8 sm:p-10 space-y-6 text-slate-900 font-sans bg-white">
                {/* 1. Corporate Header & Invoice Title */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                        ⚡
                      </div>
                      <div>
                        <h2 className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                          NEXIFY FORGE DEVOPS TECHNOLOGIES
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold mt-0.5">
                          Enterprise Cloud Infrastructure & SRE Engineering
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-mono">
                      Corporate Office: Level 14, DLF Cyber City, Tower B, Phase III, Gurugram, India 122002<br />
                      GSTIN: <strong className="text-slate-900 font-bold">07AAACN1234F1Z5</strong> • PAN: <strong className="text-slate-900 font-bold">AAACN1234F</strong> • CIN: U72900DL2023PTC398110<br />
                      Email: billing@nexifyforge.com • Support: devops@nexifyforge.com • Web: nexifyforge.com
                    </p>
                  </div>

                  <div className="text-left sm:text-right font-mono self-stretch sm:self-auto bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
                      TAX INVOICE / SLA STATEMENT
                    </span>
                    <span className="text-base font-black text-slate-900 block">{selectedInvoice.invoiceNo}</span>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Date of Issue: <strong>{selectedInvoice.createdAt}</strong>
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Payment Due: <strong>{selectedInvoice.dueDate}</strong>
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Place of Supply: <strong>Delhi / Remote Inter-State</strong>
                    </p>
                  </div>
                </div>

                {/* 2. Client Bill To / Ship To Matrix & SLA Certificate Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                      Billed To Client Organization:
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{selectedInvoice.clientOrg}</h3>
                    <p className="text-[11px] text-slate-600 font-mono">
                      Project Fleet: <strong className="text-slate-800">{selectedInvoice.projectName}</strong>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Address: {selectedInvoice.clientAddress || 'Client Registered Operational Office, India'}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[10px] font-mono text-slate-500 border-t border-slate-200/60">
                      <span>GSTIN: <strong className="text-slate-800">{selectedInvoice.clientGstin || '09AAACP4412K1Z9'}</strong></span>
                      <span>POC: <strong className="text-slate-800">{selectedInvoice.clientEmail || 'admin@client.com'}</strong></span>
                      <span>Phone: <strong className="text-slate-800">{selectedInvoice.clientPhone || '+91 98765 00000'}</strong></span>
                    </div>
                  </div>

                  {/* Verified SLA Certificate Stamp */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>SLA Uptime Certificate</span>
                      </div>
                      <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
                        {selectedInvoice.uptimeDelivered}%
                      </p>
                      <p className="text-[10px] text-emerald-800 font-medium leading-tight">
                        Verified 99.9% Uptime Guarantee Delivered for {selectedInvoice.billingMonth}.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-emerald-200 text-[9px] font-mono text-emerald-700 flex justify-between items-center">
                      <span>Status: {selectedInvoice.status}</span>
                      <span className="font-bold">0 Rebates</span>
                    </div>
                  </div>
                </div>

                {/* 3. Detailed Service Line Items Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-2.5 px-3 w-12 text-center">S.No</th>
                        <th className="py-2.5 px-3">Service Description & Deliverables</th>
                        <th className="py-2.5 px-3 text-center">SAC Code</th>
                        <th className="py-2.5 px-3 text-center">Period</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Taxable Rate</th>
                        <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800 bg-white">
                      {selectedInvoice.lineItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900 font-sans">{item.description}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Continuous CI/CD Delivery, SSL Certificate Auto-renewal & 24/7 SRE Monitoring
                            </p>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-600">{item.sacCode}</td>
                          <td className="py-3 px-3 text-center text-slate-600">{item.period}</td>
                          <td className="py-3 px-3 text-right text-slate-600">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-medium">₹{item.rateINR.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">₹{item.amountINR.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}

                      {/* Included Zero-Cost Value Add-ons */}
                      <tr className="text-slate-500 text-[11px] bg-slate-50/40">
                        <td className="py-2 px-3 text-center">2</td>
                        <td className="py-2 px-3">
                          <span className="font-medium text-slate-700 font-sans">Automated PostgreSQL Read-Replica Backups & Snapshot Vault</span>
                        </td>
                        <td className="py-2 px-3 text-center">998314</td>
                        <td className="py-2 px-3 text-center">Included</td>
                        <td className="py-2 px-3 text-right">1</td>
                        <td className="py-2 px-3 text-right">₹0.00</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">INCLUDED</td>
                      </tr>
                      <tr className="text-slate-500 text-[11px] bg-slate-50/40">
                        <td className="py-2 px-3 text-center">3</td>
                        <td className="py-2 px-3">
                          <span className="font-medium text-slate-700 font-sans">WAF Layer-7 DDoS Threat Mitigation & Automated Bot Protection</span>
                        </td>
                        <td className="py-2 px-3 text-center">998314</td>
                        <td className="py-2 px-3 text-center">Included</td>
                        <td className="py-2 px-3 text-right">1</td>
                        <td className="py-2 px-3 text-right">₹0.00</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">INCLUDED</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. Tax Computation & Total in Words */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start font-mono">
                  {/* Left Column: Words & Payment Remittance */}
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Amount in Words:</span>
                      <p className="font-bold text-slate-900 text-xs mt-0.5">{selectedInvoice.amountInWords}</p>
                    </div>

                    {/* Bank Remittance Details & UPI */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          <span>Bank Wire / NEFT / RTGS Remittance</span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-500">HDFC BANK</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[9px]">Account Name:</span>
                          <strong className="text-slate-800">Nexify Forge Tech Pvt Ltd</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">Account Number:</span>
                          <strong className="text-slate-800">50200088991122</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">IFSC Code:</span>
                          <strong className="text-slate-800">HDFC0000123</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">UPI ID:</span>
                          <strong className="text-emerald-700">nexifyforge@hdfcbank</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Tax Breakdown Box */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Taxable Value (Subtotal):</span>
                      <span className="font-bold">₹{selectedInvoice.subtotalINR.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Central GST (CGST @ 9%):</span>
                      <span>₹{selectedInvoice.cgstAmountINR.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>State GST (SGST @ 9%):</span>
                      <span>₹{selectedInvoice.sgstAmountINR.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Integrated GST (IGST @ 0%):</span>
                      <span>₹0.00</span>
                    </div>

                    <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center font-bold text-slate-900 text-sm">
                      <span>Total Invoice Amount (INR):</span>
                      <span className="text-lg text-emerald-700 font-mono">
                        ₹{selectedInvoice.totalAmountINR.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Terms, Conditions & Authorized Signatory */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-slate-500 font-mono">
                  <div className="space-y-1 max-w-md">
                    <p className="font-bold text-slate-700 uppercase">Terms & Conditions:</p>
                    <p>1. Payment is due strictly within Net 15 days from the date of invoice.</p>
                    <p>2. Delayed payments beyond due date incur late interest @ 18% per annum.</p>
                    <p>3. This is a cryptographically verified computer-generated Tax Invoice and requires no physical signature.</p>
                  </div>

                  <div className="text-right space-y-1 sm:self-auto self-stretch">
                    <div className="w-40 h-12 border border-dashed border-emerald-300 rounded-xl bg-emerald-50/50 flex flex-col items-center justify-center text-[9px] text-emerald-800 font-bold ml-auto">
                      <span>⚡ NEXIFY FORGE AUTH</span>
                      <span className="text-[8px] text-slate-400 font-normal">Digitally Signed & Certified</span>
                    </div>
                    <p className="font-bold text-slate-800 text-[11px] mt-1">For Nexify Forge DevOps Technologies</p>
                    <p className="text-slate-400">Authorized FinOps Signatory</p>
                  </div>
                </div>
              </div>

              {/* Modal Bottom Actions (Hidden in Print) */}
              <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  A4 Paper Size • Vector Optimized • Clean Print Ready
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-5 py-2 theme-btn-primary rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Tax Invoice (A4)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
