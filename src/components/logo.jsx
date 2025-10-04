export default function Logo({ size = "md", showText = true, className = "" }) {
  const sizes = {
    sm: { svg: "w-6 h-6", text: "text-lg" },
    md: { svg: "w-8 h-8", text: "text-xl" },
    lg: { svg: "w-12 h-12", text: "text-2xl" },
    xl: { svg: "w-16 h-16", text: "text-3xl" }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 100 100" className={currentSize.svg}>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#238636" strokeOpacity="0.1" strokeWidth="1.5"/>
        <circle cx="20" cy="30" r="5" fill="#58a6ff"/> 
        <circle cx="80" cy="70" r="5" fill="#238636"/>
        <path 
          d="M 20 30 C 50 10, 50 90, 80 70" 
          stroke="#58a6ff" 
          strokeWidth="4" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <animate 
            attributeName="stroke-dasharray" 
            values="10 10; 100 0; 10 10" 
            dur="5s" 
            repeatCount="indefinite"
          />
        </path>
      </svg>

      {showText && (
        <span className={`${currentSize.text} font-bold text-white tracking-tight`}>
          Synapse
        </span>
      )}
    </div>
  );
}