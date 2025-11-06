interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const Button = ({ children, onClick, style, disabled }: ButtonProps) => {
  return (
    <button 
      onClick={onClick} 
      style={style} 
      disabled={disabled}
      className="text-white px-4 py-2 rounded hover:opacity-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
};

export default Button;