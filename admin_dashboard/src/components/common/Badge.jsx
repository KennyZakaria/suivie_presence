const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    info: 'bg-blue-100 text-blue-700',
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-orange-100 text-orange-700',
    level1: 'bg-yellow-100 text-yellow-800',
    level2: 'bg-orange-100 text-orange-800',
    level3: 'bg-red-100 text-red-800',
    resolved: 'bg-green-100 text-green-700',
    open: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
