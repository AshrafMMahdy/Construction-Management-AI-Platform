
import React from 'react';

interface NarrativeDisplayProps {
  narrative: string;
}

const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({ narrative }) => {
  const renderNarrativeBlocks = () => {
    if (!narrative) return null;

    // Remove all asterisks (markdown-style bolding/italics)
    const cleanedNarrative = narrative.replace(/\*/g, '');

    // Split by one or more newlines to create paragraphs, and remove empty lines.
    const paragraphs = cleanedNarrative.split(/\n+/).filter(p => p.trim() !== '');

    return paragraphs.map((paragraph, index) => (
      <p key={index}>{paragraph.trim()}</p>
    ));
  };


  return (
    <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-brand-accent mb-4">Schedule Rationale</h3>
      <div className="prose prose-invert prose-p:text-brand-light prose-p:leading-relaxed text-brand-light space-y-4">
        {renderNarrativeBlocks()}
      </div>
    </div>
  );
};

export default NarrativeDisplay;
