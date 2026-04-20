import { motion } from 'framer-motion';
import ConfidenceMeter from './ConfidenceMeter';
import { labelFeature } from '../../constants/features';

function typeLabel(issue) {
  return issue.issue_type || issue.type || 'â';
}

function getConfidenceColor(confidence) {
  if (confidence >= 0.75) return 'bg-positive';
  if (confidence >= 0.45) return 'bg-accent-orange';
  return 'bg-negative';
}

function getSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'text-negative';
    case 'high': return 'text-accent-orange';
    case 'medium': return 'text-accent-cyan';
    case 'low': return 'text-text-secondary';
    default: return 'text-text-secondary';
  }
}

export default function IssueList({ issues }) {
  // MOCK DATA FOR DEMO - Organized by issue type
  const demoIssues = {
    'Systemic': [
      {
        id: 'mock_1',
        feature: 'app_performance',
        issue_type: 'Systemic',
        severity: 'Critical',
        affected_pct: 0.35,
        recommendation: 'Core performance degradation detected across all devices. Immediate optimization of background processes required.',
        confidence_level: 'high',
        confidence: 0.92
      }
    ],
    'Batch': [
      {
        id: 'mock_2',
        feature: 'ui_ux',
        issue_type: 'Batch',
        severity: 'High',
        affected_pct: 0.22,
        recommendation: 'UI rendering issues detected in recent build version affecting specific device models.',
        confidence_level: 'high',
        confidence: 0.88
      },
      {
        id: 'mock_3',
        feature: 'delivery',
        issue_type: 'Batch',
        severity: 'Medium',
        affected_pct: 0.15,
        recommendation: 'Delivery delays concentrated in specific geographic regions due to logistics constraints.',
        confidence_level: 'medium',
        confidence: 0.65
      }
    ],
    'Isolated': [
      {
        id: 'mock_4',
        feature: 'customer_service',
        issue_type: 'Isolated',
        severity: 'Low',
        affected_pct: 0.08,
        recommendation: 'Individual user reports of delayed response times, not indicating systemic issues.',
        confidence_level: 'medium',
        confidence: 0.55
      },
      {
        id: 'mock_5',
        feature: 'pricing',
        issue_type: 'Isolated',
        severity: 'Low',
        affected_pct: 0.05,
        recommendation: 'Few users reporting confusion about pricing structure, suggests need for better documentation.',
        confidence_level: 'low',
        confidence: 0.35
      }
    ]
  };

  const displayIssues = issues?.length ? { 'All': issues } : demoIssues;

  if (!displayIssues || Object.keys(displayIssues).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-text-secondary font-mono">No ranked issues yet â insights appear as clusters stabilize in the graph pipeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="sr-only">Issue Intelligence Panel</h3>
      
      {/* Three-column Kanban layout */}
      <div className="grid grid-cols-3 gap-6">
        {Object.entries(displayIssues).map(([columnType, columnIssues], colIndex) => (
          <div key={columnType} className="space-y-4">
            {/* Column Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIndex * 0.1 }}
              className="flex items-center justify-between"
            >
              <h4 className="font-display font-bold text-text-primary text-sm">
                {columnType}
              </h4>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  columnType === 'Systemic' ? 'bg-negative' :
                  columnType === 'Batch' ? 'bg-accent-orange' :
                  'bg-text-secondary'
                }`} />
                <span className="text-xs font-mono text-text-secondary">
                  {columnIssues.length}
                </span>
              </div>
            </motion.div>

            {/* Issues in column */}
            <div className="space-y-3 min-h-[200px]">
              {columnIssues.map((issue, issueIndex) => (
                <motion.div
                  key={issue.id || issue.issue_id || issueIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: colIndex * 0.1 + issueIndex * 0.08,
                    duration: 0.3
                  }}
                  className="card p-3 cursor-pointer hover:border-accent-cyan/50 transition-all"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)' }}
                >
                  {/* Issue Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-accent-cyan">
                          {labelFeature(issue.feature)}
                        </span>
                        <span className={`text-xs font-mono ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                      </div>
                      
                      {/* Confidence Bar */}
                      <div className="w-full h-1 bg-bg-elevated rounded-industrial overflow-hidden mb-2">
                        <motion.div
                          className={`h-full ${getConfidenceColor(issue.confidence)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(issue.confidence || 0) * 100}%` }}
                          transition={{ delay: colIndex * 0.1 + issueIndex * 0.08 + 0.3, duration: 0.4 }}
                        />
                      </div>
                    </div>
                    
                    {/* Impact Badge */}
                    {issue.affected_pct != null && (
                      <div className="chip text-xs font-mono">
                        {Math.round(issue.affected_pct * 100)}% impact
                      </div>
                    )}
                  </div>

                  {/* Recommendation */}
                  {issue.recommendation && (
                    <p className="text-xs text-text-secondary leading-relaxed mb-2 line-clamp-3">
                      {issue.recommendation}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ConfidenceMeter level={issue.confidence_level} value={issue.confidence} />
                      <span className="text-[10px] font-mono text-text-secondary">
                        {Math.round((issue.confidence || 0) * 100)}% confidence
                      </span>
                    </div>
                    
                    {/* Action indicator */}
                    <motion.div
                      className="w-4 h-4 bg-accent-cyan/20 rounded-industrial flex items-center justify-center"
                      whileHover={{ scale: 1.2 }}
                    >
                      <span className="text-accent-cyan text-xs">â</span>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-border text-xs font-mono text-text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-negative rounded-industrial" />
          <span>Systemic (Critical)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-accent-orange rounded-industrial" />
          <span>Batch (High)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-text-secondary rounded-industrial" />
          <span>Isolated (Low)</span>
        </div>
      </div>
    </div>
  );
}
