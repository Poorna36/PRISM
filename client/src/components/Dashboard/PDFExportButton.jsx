import { useState } from 'react';
import { motion } from 'framer-motion';
import { generateReport } from '../../api';

export default function PDFExportButton({ productId, platform }) {
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState(null);

  async function onClick() {
    setStatus('loading');
    setMsg(null);
    try {
      const res = await generateReport(productId, platform || 'all');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Export failed');
      const url = data.report_url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        setMsg('Report ready');
      }
    } catch (e) {
      setMsg(e.message || 'Failed');
    } finally {
      setStatus('idle');
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={status === 'loading'}
        className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        whileTap={{ scale: 0.98 }}
      >
        {status === 'loading' ? 'Generating PDF…' : 'Download PDF report'}
      </motion.button>
      {msg && <p className="text-center text-xs text-slate-500">{msg}</p>}
    </div>
  );
}
