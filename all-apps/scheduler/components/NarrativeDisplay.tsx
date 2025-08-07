
import React from 'react';

interface NarrativeDisplayProps {
  narrative: string;
}

const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({ narrative }) => {
  return (
    <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-brand-accent mb-4">Schedule Rationale</h3>
      <div className="prose prose-invert prose-p:text-brand-light prose-p:leading-relaxed text-brand-light space-y-4">
        {narrative.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
};

export default NarrativeDisplay;
