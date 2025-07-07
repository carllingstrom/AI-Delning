import React from 'react';
import { calculateProjectScore, getScoreColor, getScoreBarColor } from '@/lib/projectScore';

interface ProjectScoreBarProps {
  project: any;
  showDetails?: boolean;
}

export const ProjectScoreBar: React.FC<ProjectScoreBarProps> = ({ project, showDetails = false }) => {
  const score = calculateProjectScore(project);

  return (
    <div className="mt-3 pt-3 border-t border-gray-600">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-300">Delningspoäng</span>
        <span className={`text-xs font-bold ${getScoreColor(score.percentage)}`}>
          {score.percentage}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${score.percentage}%`,
            backgroundColor: getScoreBarColor(score.percentage)
          }}
        />
      </div>
      
      {/* Score breakdown tooltip on hover */}
      {showDetails && (
        <div className="mt-2 text-xs space-y-1">
          {score.percentage < 60 && score.missingHighValue.length > 0 && (
            <div className="text-orange-400">
              Saknas för högre poäng: {score.missingHighValue.slice(0, 2).join(', ')}
              {score.missingHighValue.length > 2 && ` +${score.missingHighValue.length - 2} till`}
            </div>
          )}
          <div className="grid grid-cols-2 gap-1 text-gray-400 text-xs">
            <div>Basic: {score.breakdown.basic.score}/{score.breakdown.basic.max}</div>
            <div>Budget: {score.breakdown.financial.score}/{score.breakdown.financial.max}</div>
            <div>Effekter: {score.breakdown.effects.score}/{score.breakdown.effects.max}</div>
            <div>Teknik: {score.breakdown.technical.score}/{score.breakdown.technical.max}</div>
            <div>Juridik: {score.breakdown.governance.score}/{score.breakdown.governance.max}</div>
            <div>Totalt: {score.totalScore}/{score.maxScore}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectScoreBar; 