import { motion } from 'framer-motion';
import ConfidenceMeter from './ConfidenceMeter';
import { labelFeature } from '../../constants/features';

function typeLabel(issue) {
  return issue.issue_type || issue.type || '—';
}

export default function IssueList({ issues }) {
  if (!issues?.length) {
    return (
      <p className="text-sm text-slate-500">
        No ranked issues yet — insights appear as clusters stabilize in the graph pipeline.
      </p>
    );
  }

  return (
    <div>
      <h3 className="sr-only">Prioritized recommendations</h3>
      <ul className="space-y-3">
        {issues.map((issue, i) => (
          <motion.li
            key={issue.id || issue.issue_id || i}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-white">{labelFeature(issue.feature)}</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                {typeLabel(issue)}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                {issue.severity}
              </span>
              {issue.affected_pct != null && (
                <span className="text-xs text-sky-400">{Math.round(issue.affected_pct * 100)}% impact</span>
              )}
            </div>
            {issue.recommendation && (
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{issue.recommendation}</p>
            )}
            <ConfidenceMeter level={issue.confidence_level} value={issue.confidence} />
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
