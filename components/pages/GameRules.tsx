import React from 'react';
import { Shield, Target, Users, AlertTriangle, BookOpen } from 'lucide-react';

const GameRules: React.FC = () => {
  return (
    <div className="p-4 space-y-6 animate-fade-in pb-24">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-display font-bold italic">OFFICIAL <span className="text-blue-300">GAME RULES</span></h2>
        <p className="text-sm text-blue-100 mt-1">Read carefully to avoid disqualification.</p>
      </div>

      <div className="space-y-4">
        <RuleCard 
            icon={Target}
            title="General Gameplay"
            rules={[
                "Emulators are strictly prohibited.",
                "Teaming up with enemies is not allowed.",
                "Use of hacks/scripts leads to permanent ban.",
                "Maintain sportsmanship at all times."
            ]}
        />
        
        <RuleCard 
            icon={Users}
            title="Squad & Duo Rules"
            rules={[
                "All team members must be present in lobby 5 mins before start.",
                "Team leader is responsible for slot registration.",
                "No substitution allowed after match starts."
            ]}
        />

        <RuleCard 
            icon={AlertTriangle}
            title="Disqualification Criteria"
            rules={[
                "Abusing in global chat.",
                "Using bugs/glitches intentionally.",
                "Fail to provide screenshot if requested."
            ]}
        />
        
        <RuleCard 
            icon={Shield}
            title="Prize Distribution"
            rules={[
                "Winner Takes All: Prize is awarded to Rank #1 only.",
                "Winnings credited within 1 hour of match completion.",
                "Kill proofs (screenshots) are mandatory for claim disputes.",
                "Admin decision is final."
            ]}
        />
      </div>
    </div>
  );
};

const RuleCard: React.FC<{ icon: any, title: string, rules: string[] }> = ({ icon: Icon, title, rules }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                <Icon size={20} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-gray-200 text-sm uppercase tracking-wide">{title}</h3>
        </div>
        <ul className="space-y-2">
            {rules.map((rule, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                    <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mt-1.5 shrink-0"></div>
                    <span>{rule}</span>
                </li>
            ))}
        </ul>
    </div>
);

export default GameRules;