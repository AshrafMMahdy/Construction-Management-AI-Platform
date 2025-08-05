import React from 'react';
import { ProjectInput, ProjectFeatures } from '../types';

interface ProjectFormProps {
  projectInput: ProjectInput;
  onInputChange: (newInput: ProjectInput) => void;
  projectFeatures: ProjectFeatures;
  disabled: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectInput, onInputChange, projectFeatures, disabled }) => {
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    onInputChange({
      ...projectInput,
      isNotInDb: isChecked,
      // Clear the other input type to enforce one method of project definition
      description: isChecked ? projectInput.description : '',
      selections: isChecked ? {} : projectInput.selections,
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
     onInputChange({
      ...projectInput,
      description: e.target.value,
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    onInputChange({
      ...projectInput,
      selections: {
        ...projectInput.selections,
        [name]: value,
      }
    });
  };
    
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-brand-accent mb-2">2. Define Project</h3>
      <div className="space-y-4">
        
        {/* Dropdowns for features */}
        <div className={`space-y-4 transition-opacity duration-300 ${projectInput.isNotInDb ? 'opacity-50' : 'opacity-100'}`}>
          <p className="text-sm text-brand-muted">
            Select project features from your data to generate a similar schedule.
          </p>
          {Object.keys(projectFeatures).length > 0 ? (
            Object.keys(projectFeatures).map(featureName => (
              <div key={featureName}>
                <label htmlFor={featureName} className="block text-sm font-medium text-brand-light mb-1">{featureName}</label>
                <select
                  id={featureName}
                  name={featureName}
                  value={projectInput.selections[featureName] || ''}
                  onChange={handleSelectChange}
                  disabled={disabled || projectInput.isNotInDb}
                  className="w-full p-2 bg-brand-secondary border-2 border-brand-muted rounded-md focus:outline-none focus:border-brand-accent transition-colors text-brand-light disabled:cursor-not-allowed"
                >
                  {projectFeatures[featureName].map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            ))
          ) : (
            <div className="text-center p-4 border-2 border-dashed border-brand-muted rounded-md">
                <p className="text-sm text-brand-muted">No relevant feature columns found in your data for selection.</p>
            </div>
          )}
        </div>

        <div className="relative flex items-center justify-center my-4">
            <div className="flex-grow border-t border-brand-muted"></div>
            <span className="flex-shrink mx-4 text-xs uppercase text-brand-muted">Or</span>
            <div className="flex-grow border-t border-brand-muted"></div>
        </div>

        {/* Checkbox and Textarea */}
        <div className="flex items-center">
          <input
            id="not-in-db"
            type="checkbox"
            checked={projectInput.isNotInDb}
            onChange={handleCheckboxChange}
            disabled={disabled}
            className="h-4 w-4 rounded border-brand-muted text-brand-accent bg-brand-secondary focus:ring-brand-accent"
          />
          <label htmlFor="not-in-db" className="ml-2 block text-sm text-brand-light">
            Describe a new project not in the database
          </label>
        </div>

        <textarea
          value={projectInput.description}
          onChange={handleDescriptionChange}
          placeholder="e.g., A 3-story commercial building with a basement and extensive glass facade."
          disabled={disabled || !projectInput.isNotInDb}
          className="w-full h-24 p-3 bg-brand-secondary border-2 border-brand-muted rounded-md focus:outline-none focus:border-brand-accent transition-colors text-brand-light placeholder-brand-muted disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="New project description"
        />
      </div>
    </div>
  );
};

export default ProjectForm;
