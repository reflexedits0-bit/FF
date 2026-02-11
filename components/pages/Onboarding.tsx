import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onFinish: () => void;
}

const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop",
    title: "COMPETE & CONQUER",
    subtitle: "Join the ultimate eSports arena. Battle against the best players and prove your dominance.",
    accent: "text-red-500"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2671&auto=format&fit=crop",
    title: "WIN REAL REWARDS",
    subtitle: "Turn your skills into cash. Instant withdrawals and massive prize pools await.",
    accent: "text-yellow-400"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2665&auto=format&fit=crop",
    title: "CLIMB THE RANKS",
    subtitle: "Track your stats, earn badges, and become a legend in the community.",
    accent: "text-blue-500"
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      {/* Background Image Layer */}
      {SLIDES.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
          <img 
            src={slide.image} 
            alt={slide.title} 
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 flex-1 flex flex-col justify-end p-8 pb-12">
        <div className="mb-8 animate-fade-in key={currentSlide}">
           <div className="flex space-x-2 mb-6">
              {SLIDES.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30'
                  }`}
                />
              ))}
           </div>

           <h1 className="text-5xl font-display font-bold italic leading-none mb-4 drop-shadow-lg">
             {SLIDES[currentSlide].title.split(' ')[0]} <br/>
             <span className={SLIDES[currentSlide].accent}>
               {SLIDES[currentSlide].title.split(' ').slice(1).join(' ')}
             </span>
           </h1>
           <p className="text-gray-300 text-sm leading-relaxed max-w-xs font-medium">
             {SLIDES[currentSlide].subtitle}
           </p>
        </div>

        <button 
          onClick={nextSlide}
          className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center space-x-2 active:scale-95 transition-transform"
        >
          <span>{currentSlide === SLIDES.length - 1 ? "GET STARTED" : "CONTINUE"}</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;