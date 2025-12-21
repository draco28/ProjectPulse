interface FeedbackSummary {
  positive: number;
  negative: number;
  ratio: number;
  totalViews: number;
}

interface FeedbackFunnelCardProps {
  feedback: FeedbackSummary;
}

export function FeedbackFunnelCard({ feedback }: FeedbackFunnelCardProps) {
  const totalVotes = feedback.positive + feedback.negative;

  return (
    <div className="neu-raised rounded-3xl p-5">
      <h2 className="text-lg font-semibold text-white">Feedback Funnel</h2>
      <p className="text-sm text-slate">How readers are rating documentation.</p>

      <div className="mt-6 space-y-4 text-sm text-slate">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide">
            <span>Helpful</span>
            <span>{feedback.positive.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-green-400/80"
              style={{ width: totalVotes ? `${(feedback.positive / totalVotes) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide">
            <span>Needs Work</span>
            <span>{feedback.negative.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-red-400/80"
              style={{ width: totalVotes ? `${(feedback.negative / totalVotes) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-black/20 p-4 text-sm text-slate">
        <p className="text-xs uppercase tracking-wide text-white/70">Approval Rate</p>
        <p className="mt-1 text-3xl font-semibold text-white">{feedback.ratio}%</p>
        <p className="mt-2 text-xs text-slate">
          Based on {totalVotes.toLocaleString()} votes and {feedback.totalViews.toLocaleString()}{' '}
          views.
        </p>
      </div>
    </div>
  );
}
