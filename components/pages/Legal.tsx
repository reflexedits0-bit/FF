import React from 'react';
import { Tab } from '../types';
import { Shield, FileText, Info, Scale } from 'lucide-react';

interface LegalProps {
  type: Tab;
}

const Legal: React.FC<LegalProps> = ({ type }) => {
  const getContent = () => {
    switch (type) {
      case 'about':
        return {
          title: "About Arena AR",
          icon: Info,
          color: "text-blue-500",
          content: (
            <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Arena AR is the premier destination for competitive mobile gaming. Founded in 2025, we provide a secure, fair, and thrilling platform for gamers to showcase their skills and earn real rewards.</p>
              <p>Our mission is to democratize eSports, making tournament play accessible to everyone, from casual players to aspiring professionals.</p>
              <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-xl mt-4 border border-gray-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-2">Version 2.4.0</h4>
                <p className="text-xs">Build: 20250212.01</p>
                <p className="text-xs">© 2025 Arena AR Inc.</p>
              </div>
            </div>
          )
        };
      case 'app_rules':
        return {
          title: "Platform Rules",
          icon: Shield,
          color: "text-red-500",
          content: (
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400 list-disc pl-5">
              <li>Users must be 18 years or older to participate in cash tournaments.</li>
              <li>Multiple accounts are strictly prohibited and will lead to an IP ban.</li>
              <li>Any form of collusion or match-fixing is non-tolerable.</li>
              <li>Winnings are subject to verification before withdrawal.</li>
              <li>Harassment of other players or support staff will result in account suspension.</li>
            </ul>
          )
        };
      case 'privacy':
        return {
          title: "Privacy Policy",
          icon: FileText,
          color: "text-green-500",
          content: (
            <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.</p>
              <h4 className="font-bold text-slate-800 dark:text-white">Data Collection</h4>
              <p>We collect email, username, and device information to provide our services and prevent fraud.</p>
              <h4 className="font-bold text-slate-800 dark:text-white">Data Usage</h4>
              <p>Your data is used to manage your account, process transactions, and improve app performance. We do not sell your data to third parties.</p>
            </div>
          )
        };
      case 'fair_play':
        return {
          title: "Fair Play Policy",
          icon: Scale,
          color: "text-purple-500",
          content: (
            <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Arena AR is committed to ensuring a level playing field for all participants.</p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl">
                 <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">Anti-Cheat System</h4>
                 <p className="text-xs text-red-800 dark:text-red-300">Our automated systems and manual review teams monitor all matches. Any use of third-party software (aimbots, wallhacks, macros) is detected and punished immediately.</p>
              </div>
              <p>If you suspect a player of cheating, please use the 'Report Issue' function in the Support Center with video evidence.</p>
            </div>
          )
        };
      case 'terms':
        return {
          title: "Terms & Conditions",
          icon: FileText,
          color: "text-gray-800 dark:text-gray-200",
          content: (
            <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <p>By using Arena AR, you agree to these Terms. Please read them carefully.</p>
              <p><strong className="text-slate-700 dark:text-gray-300">1. Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials.</p>
              <p><strong className="text-slate-700 dark:text-gray-300">2. Payments:</strong> All deposits and entry fees are final. Refunds are only processed in case of technical errors on our end.</p>
              <p><strong className="text-slate-700 dark:text-gray-300">3. Termination:</strong> We reserve the right to terminate accounts that violate our rules without prior notice.</p>
            </div>
          )
        };
      default:
        return { title: "Info", icon: Info, color: "text-gray-500", content: <p>Content not found.</p> };
    }
  };

  const data = getContent();
  const Icon = data.icon;

  return (
    <div className="p-4 animate-fade-in pb-24">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 mb-6 transition-colors">
        <div className="flex items-center space-x-4 mb-4">
             <div className={`p-3 rounded-full bg-gray-50 dark:bg-slate-800 ${data.color}`}>
                 <Icon size={24} />
             </div>
             <h2 className="text-2xl font-display font-bold italic text-slate-900 dark:text-white uppercase tracking-wide">{data.title}</h2>
        </div>
        <div className="h-px bg-gray-100 dark:bg-slate-800 w-full mb-6"></div>
        {data.content}
      </div>
    </div>
  );
};

export default Legal;