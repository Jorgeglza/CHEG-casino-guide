export type FlowNodeId = 'comeout' | 'natural' | 'craps' | 'pointset' | 'odds' | 'pointwin' | 'sevenout';

interface FlowDiagramProps {
  active: FlowNodeId;
}

function Node({
  id,
  label,
  sub,
  tone,
  active,
}: {
  id: FlowNodeId;
  label: string;
  sub?: string;
  tone: 'neutral' | 'win' | 'lose' | 'info';
  active: FlowNodeId;
}) {
  const isActive = id === active;
  return (
    <div className={`flow-node flow-node--${tone} ${isActive ? 'flow-node--active' : ''}`}>
      <span className="flow-node-label">{label}</span>
      {sub && <span className="flow-node-sub">{sub}</span>}
    </div>
  );
}

export default function FlowDiagram({ active }: FlowDiagramProps) {
  return (
    <div className="flow-diagram">
      <Node id="comeout" label="Come-Out Roll" sub="Pass Line bet is live" tone="neutral" active={active} />
      <div className="flow-connector" />
      <div className="flow-branch">
        <Node id="natural" label="7 or 11" sub="Instant win" tone="win" active={active} />
        <Node id="pointset" label="4, 5, 6, 8, 9, 10" sub="Point is set" tone="info" active={active} />
        <Node id="craps" label="2, 3, or 12" sub="Instant loss" tone="lose" active={active} />
      </div>
      <div className="flow-connector flow-connector--from-point" />
      <Node id="odds" label="Place your Odds bet" sub="Zero house edge" tone="info" active={active} />
      <div className="flow-connector" />
      <div className="flow-branch flow-branch--two">
        <Node id="pointwin" label="Point rolls again" sub="Pass Line + Odds win" tone="win" active={active} />
        <Node id="sevenout" label="7 rolls first" sub='"Seven-out" — both lose' tone="lose" active={active} />
      </div>
    </div>
  );
}
